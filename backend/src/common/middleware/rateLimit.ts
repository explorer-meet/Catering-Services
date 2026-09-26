import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";

interface Bucket {
  count: number;
  resetAt: number;
}

/// Small in-memory throttle for unauthenticated endpoints such as login.
/// Good enough for a single-instance deployment; swap for Redis when scaling out.
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      next(new AppError(options.message ?? "Too many attempts. Please try again later.", 429));
      return;
    }

    next();
  };
}
