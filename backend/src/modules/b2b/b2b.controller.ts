import { Request, Response } from "express";
import { B2BDirection, B2BOrderStatus } from "@prisma/client";
import * as b2bService from "./b2b.service";

export async function getOrders(req: Request, res: Response) {
  res.status(200).json(
    await b2bService.listOrders({
      direction: req.query.direction as B2BDirection | undefined,
      status: req.query.status as B2BOrderStatus | undefined,
      search: req.query.search as string | undefined,
    }),
  );
}

export async function getSummary(_req: Request, res: Response) {
  res.status(200).json(await b2bService.getSummary());
}

export async function getOrderById(req: Request, res: Response) {
  res.status(200).json(await b2bService.getOrder(req.params.id));
}

export async function postOrder(req: Request, res: Response) {
  res.status(201).json(await b2bService.createOrder(req.body));
}

export async function putOrder(req: Request, res: Response) {
  res.status(200).json(await b2bService.updateOrder(req.params.id, req.body));
}

export async function patchStatus(req: Request, res: Response) {
  res.status(200).json(await b2bService.updateStatus(req.params.id, req.body.status));
}

export async function removeOrder(req: Request, res: Response) {
  await b2bService.deleteOrder(req.params.id);
  res.status(204).send();
}

export async function postPayment(req: Request, res: Response) {
  res.status(201).json(await b2bService.addPayment(req.params.id, req.body));
}

export async function removePayment(req: Request, res: Response) {
  res.status(200).json(await b2bService.deletePayment(req.params.paymentId));
}
