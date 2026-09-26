import { Request, Response } from "express";
import { VendorCategory } from "@prisma/client";
import * as vendorService from "./vendor.service";
import * as ledgerService from "./ledger.service";

export async function getVendors(req: Request, res: Response) {
  res.status(200).json(
    await vendorService.listVendors({
      search: req.query.search as string | undefined,
      category: req.query.category as VendorCategory | undefined,
    }),
  );
}

export async function getVendorSummary(_req: Request, res: Response) {
  res.status(200).json(await vendorService.getVendorSummary());
}

export async function getVendorById(req: Request, res: Response) {
  res.status(200).json(await vendorService.getVendor(req.params.id));
}

export async function postVendor(req: Request, res: Response) {
  res.status(201).json(await vendorService.createVendor(req.body));
}

export async function patchVendor(req: Request, res: Response) {
  res.status(200).json(await vendorService.updateVendor(req.params.id, req.body));
}

export async function removeVendor(req: Request, res: Response) {
  await vendorService.deleteVendor(req.params.id);
  res.status(204).send();
}

export async function getLedger(req: Request, res: Response) {
  res.status(200).json(await ledgerService.getLedger(req.params.id));
}

export async function postLedgerEntry(req: Request, res: Response) {
  res.status(201).json(await ledgerService.addLedgerEntry(req.params.id, req.body));
}

export async function patchLedgerEntry(req: Request, res: Response) {
  res.status(200).json(await ledgerService.updateLedgerEntry(req.params.entryId, req.body));
}

export async function removeLedgerEntry(req: Request, res: Response) {
  res.status(200).json(await ledgerService.deleteLedgerEntry(req.params.entryId));
}
