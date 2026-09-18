import { Request, Response } from "express";
import {
  generateMenuPackagesForEnquiry,
  getMenuPackage,
  listMenuPackagesForEnquiry,
  selectMenuPackage,
} from "./menu.service";
import { estimateTentativePrice } from "../category/pricing.service";

export async function postEstimatePrice(req: Request, res: Response) {
  const { guestCount, categories } = req.body;
  const result = await estimateTentativePrice({ guestCount, categoryNames: categories });
  res.status(200).json(result);
}

export async function postGeneratePackages(req: Request, res: Response) {
  const packages = await generateMenuPackagesForEnquiry(req.params.enquiryId);
  res.status(201).json(packages);
}

export async function getPackagesForEnquiry(req: Request, res: Response) {
  const packages = await listMenuPackagesForEnquiry(req.params.enquiryId);
  res.status(200).json(packages);
}

export async function getPackageById(req: Request, res: Response) {
  const pkg = await getMenuPackage(req.params.id);
  res.status(200).json(pkg);
}

export async function postSelectPackage(req: Request, res: Response) {
  const pkg = await selectMenuPackage(req.params.id);
  res.status(200).json(pkg);
}
