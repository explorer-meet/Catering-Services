import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getLedger,
  getVendorById,
  getVendorSummary,
  getVendors,
  patchLedgerEntry,
  patchVendor,
  postLedgerEntry,
  postVendor,
  removeLedgerEntry,
  removeVendor,
} from "./vendor.controller";

/// Owner-side vendor directory and per-vendor account ledger
export const vendorRouter = Router();

vendorRouter.get("/summary", asyncHandler(getVendorSummary));

vendorRouter.get("/", asyncHandler(getVendors));
vendorRouter.post("/", asyncHandler(postVendor));

vendorRouter.delete("/entries/:entryId", asyncHandler(removeLedgerEntry));
vendorRouter.patch("/entries/:entryId", asyncHandler(patchLedgerEntry));

vendorRouter.get("/:id", asyncHandler(getVendorById));
vendorRouter.patch("/:id", asyncHandler(patchVendor));
vendorRouter.delete("/:id", asyncHandler(removeVendor));

vendorRouter.get("/:id/ledger", asyncHandler(getLedger));
vendorRouter.post("/:id/ledger", asyncHandler(postLedgerEntry));
