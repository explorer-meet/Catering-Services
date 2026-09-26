import { Request, Response } from "express";
import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { requireAuth, requireRole } from "../../common/middleware/auth";
import * as authService from "./auth.service";

async function postLogin(req: Request, res: Response) {
  res.status(200).json(await authService.login(req.body.email, req.body.password));
}

async function getMe(req: Request, res: Response) {
  res.status(200).json(await authService.getCurrentUser(req.user!.id));
}

async function postChangePassword(req: Request, res: Response) {
  await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  res.status(204).send();
}

async function getUsers(_req: Request, res: Response) {
  res.status(200).json(await authService.listUsers());
}

async function postUser(req: Request, res: Response) {
  res.status(201).json(await authService.createUser(req.body));
}

async function patchUser(req: Request, res: Response) {
  res.status(200).json(await authService.updateUser(req.params.id, req.body));
}

async function removeUser(req: Request, res: Response) {
  await authService.deleteUser(req.params.id, req.user!.id);
  res.status(204).send();
}

export const authRouter = Router();

authRouter.post("/login", asyncHandler(postLogin));
authRouter.get("/me", requireAuth, asyncHandler(getMe));
authRouter.post("/change-password", requireAuth, asyncHandler(postChangePassword));

/// Only an owner may manage staff accounts
export const userRouter = Router();

userRouter.use(requireAuth, requireRole("OWNER"));
userRouter.get("/", asyncHandler(getUsers));
userRouter.post("/", asyncHandler(postUser));
userRouter.patch("/:id", asyncHandler(patchUser));
userRouter.delete("/:id", asyncHandler(removeUser));
