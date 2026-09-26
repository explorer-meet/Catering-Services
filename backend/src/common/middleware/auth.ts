import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../common/errors";
import { verifyToken } from "../../modules/auth/auth.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole; name: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new AppError("Authentication required", 401));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403));
      return;
    }
    next();
  };
}
