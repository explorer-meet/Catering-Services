import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { AppError, NotFoundError } from "../../common/errors";

const SALT_ROUNDS = 12;

export interface TokenPayload {
  sub: string;
  role: UserRole;
  name: string;
}

function publicUser(user: { id: string; name: string; email: string; role: UserRole; isActive: boolean; lastLoginAt: Date | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    throw new AppError("Session expired. Please sign in again.", 401);
  }
}

function assertStrongPassword(password: string) {
  if (!password || password.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 422);
  }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() ?? "" } });

  // Same generic message and a dummy compare keep valid/invalid emails indistinguishable
  if (!user || !user.isActive) {
    await bcrypt.compare(password ?? "", "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    throw new AppError("Invalid email or password", 401);
  }

  const matches = await bcrypt.compare(password ?? "", user.passwordHash);
  if (!matches) throw new AppError("Invalid email or password", 401);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    token: signToken({ sub: user.id, role: user.role, name: user.name }),
    user: publicUser(user),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new AppError("Account is no longer active", 401);
  return publicUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  const matches = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
  if (!matches) throw new AppError("Current password is incorrect", 401);

  assertStrongPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS) },
  });
}

// ---------- User administration (owner only) ----------

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(publicUser);
}

export async function createUser(input: { name: string; email: string; password: string; role: UserRole }) {
  const email = input.email?.trim().toLowerCase();
  if (!input.name?.trim()) throw new AppError("Name is required", 422);
  if (!email) throw new AppError("Email is required", 422);
  assertStrongPassword(input.password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("A user with this email already exists", 409);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      role: input.role ?? "MANAGER",
      passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
    },
  });

  return publicUser(user);
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: UserRole; isActive?: boolean; password?: string },
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");

  if (user.role === "OWNER" && input.isActive === false) {
    const activeOwners = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
    if (activeOwners <= 1) throw new AppError("The last active owner cannot be deactivated", 409);
  }

  if (input.password !== undefined) assertStrongPassword(input.password);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.password ? { passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS) } : {}),
    },
  });

  return publicUser(updated);
}

export async function deleteUser(id: string, actingUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");
  if (id === actingUserId) throw new AppError("You cannot delete your own account", 409);

  if (user.role === "OWNER") {
    const owners = await prisma.user.count({ where: { role: "OWNER" } });
    if (owners <= 1) throw new AppError("The last owner account cannot be deleted", 409);
  }

  await prisma.user.delete({ where: { id } });
}

/// Creates the first owner from environment variables when no user exists yet
export async function bootstrapOwner() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const { bootstrapOwnerEmail, bootstrapOwnerPassword, bootstrapOwnerName } = env;
  if (!bootstrapOwnerEmail || !bootstrapOwnerPassword) {
    console.warn(
      "[auth] No users exist and BOOTSTRAP_OWNER_EMAIL / BOOTSTRAP_OWNER_PASSWORD are not set — the owner console cannot be accessed.",
    );
    return;
  }

  await prisma.user.create({
    data: {
      name: bootstrapOwnerName,
      email: bootstrapOwnerEmail.trim().toLowerCase(),
      role: "OWNER",
      passwordHash: await bcrypt.hash(bootstrapOwnerPassword, SALT_ROUNDS),
    },
  });

  console.log(`[auth] Bootstrapped owner account for ${bootstrapOwnerEmail}`);
}
