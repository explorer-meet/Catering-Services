import { Request, Response } from "express";
import { customizeMenuPackage } from "./customization.service";

export async function postCustomizeMenuPackage(req: Request, res: Response) {
  const { instruction } = req.body;
  const result = await customizeMenuPackage(req.params.menuPackageId, instruction);
  res.status(200).json(result);
}
