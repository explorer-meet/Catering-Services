import { Request, Response } from "express";
import { calculateBudget } from "./budget.service";

export function postCalculateBudget(req: Request, res: Response) {
  const breakdown = calculateBudget(req.body);
  res.status(200).json(breakdown);
}
