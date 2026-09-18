import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Quotation, Enquiry, Customer, MenuPackage, MenuPackageItem, MenuItem, MenuCategory } from "@prisma/client";

type ItemWithCategory = MenuPackageItem & { menuItem: MenuItem & { category: MenuCategory } };

type FullQuotation = Quotation & {
  enquiry: Enquiry & { customer: Customer };
  menuPackage: MenuPackage & { items: ItemWithCategory[] };
};

const OUTPUT_DIR = path.join(process.cwd(), "quotations");

export async function renderQuotationPdf(quotation: FullQuotation): Promise<string> {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const filePath = path.join(OUTPUT_DIR, `${quotation.quotationNumber}.pdf`);
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text("Catering Quotation", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Quotation #: ${quotation.quotationNumber}`);
  doc.text(`Valid until: ${quotation.validUntil.toDateString()}`);
  doc.moveDown();

  doc.fontSize(14).text("Customer Details");
  doc.fontSize(10)
    .text(`Name: ${quotation.enquiry.customer.name}`)
    .text(`Phone: ${quotation.enquiry.customer.phone}`);
  doc.moveDown();

  doc.fontSize(14).text("Event Details");
  doc.fontSize(10)
    .text(`Event type: ${quotation.enquiry.eventType}`)
    .text(`Date: ${quotation.enquiry.eventDate?.toDateString() ?? "TBD"}`)
    .text(`Location: ${quotation.enquiry.location ?? "TBD"}`)
    .text(`Guests: ${quotation.guestCount}`);
  doc.moveDown();

  doc.fontSize(14).text(`Selected Menu: ${quotation.menuPackage.name}`);
  doc.fontSize(10);
  const grouped = groupByCategory(quotation.menuPackage.items);
  for (const [category, items] of Object.entries(grouped)) {
    doc.font("Helvetica-Bold").text(category);
    doc.font("Helvetica").text(items.map((i) => i.menuItem.name).join(", "));
  }
  doc.moveDown();

  doc.fontSize(14).text("Cost Breakdown");
  doc.fontSize(10);
  addLine(doc, "Price per plate", quotation.pricePerPlate);
  addLine(doc, "Food cost", quotation.foodCost);
  addLine(doc, "Staff cost", quotation.staffCost);
  addLine(doc, "Equipment cost", quotation.equipmentCost);
  addLine(doc, "Transportation cost", quotation.transportationCost);
  addLine(doc, "Decoration cost", quotation.decorationCost);
  addLine(doc, "Other services", quotation.otherServicesCost);
  addLine(doc, "Subtotal", quotation.subtotal);
  addLine(doc, `Tax (${quotation.taxPercent}%)`, quotation.taxAmount);
  doc.font("Helvetica-Bold");
  addLine(doc, "Total Amount", quotation.totalAmount);
  doc.font("Helvetica");
  addLine(doc, "Advance payable", quotation.advanceAmount);
  doc.moveDown();

  doc.fontSize(14).text("Terms & Conditions");
  doc.fontSize(9).text(quotation.termsAndConditions ?? "Standard terms apply.");
  doc.moveDown();

  doc.fontSize(14).text("Cancellation Policy");
  doc.fontSize(9).text(quotation.cancellationPolicy ?? "Standard cancellation policy applies.");

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return `/quotations/${quotation.quotationNumber}.pdf`;
}

function addLine(doc: PDFKit.PDFDocument, label: string, amount: unknown) {
  doc.text(`${label}: Rs. ${Number(amount).toFixed(2)}`);
}

function groupByCategory(items: ItemWithCategory[]) {
  return items.reduce<Record<string, ItemWithCategory[]>>((acc, item) => {
    const key = item.menuItem.category.name;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}
