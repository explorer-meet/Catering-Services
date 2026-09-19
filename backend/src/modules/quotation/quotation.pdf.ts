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
  const doc = new PDFDocument({ margin: 44, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const maroon = "#651f38";
  const gold = "#c59b45";
  const ink = "#2b1c22";
  const muted = "#756a6e";
  const light = "#fbf6ed";

  doc.info.Title = `Vivah Caterers - ${quotation.quotationNumber}`;
  doc.rect(0, 0, doc.page.width, 116).fill(maroon);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("VIVAH CATERERS", 44, 34);
  doc.font("Helvetica").fontSize(10).fillColor("#f4dfad").text("Curated menus. Seamless celebrations.", 46, 68);
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#ffffff").text("QUOTATION", 370, 35, { align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor("#f4dfad").text(quotation.quotationNumber, 370, 67, { align: "right" });
  doc.fillColor(ink);

  doc.y = 140;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(gold).text("PREPARED FOR");
  doc.font("Helvetica-Bold").fontSize(18).fillColor(maroon).text(quotation.enquiry.customer.name);
  doc.font("Helvetica").fontSize(10).fillColor(muted).text(`${quotation.enquiry.customer.phone}  |  Valid until ${quotation.validUntil.toDateString()}`);
  doc.moveDown(1.4);

  const panelTop = doc.y;
  doc.roundedRect(44, panelTop, 247, 96, 8).fill(light);
  doc.roundedRect(303, panelTop, 247, 96, 8).fill(light);
  doc.fillColor(maroon).font("Helvetica-Bold").fontSize(11).text("EVENT DETAILS", 60, panelTop + 16);
  doc.fillColor(ink).font("Helvetica").fontSize(10)
    .text(`Type: ${quotation.enquiry.eventType}`, 60, panelTop + 39)
    .text(`Date: ${quotation.enquiry.eventDate?.toDateString() ?? "TBD"}`, 60, panelTop + 56)
    .text(`Guests: ${quotation.guestCount}`, 60, panelTop + 73);
  doc.fillColor(maroon).font("Helvetica-Bold").fontSize(11).text("SERVICE SNAPSHOT", 319, panelTop + 16);
  doc.fillColor(ink).font("Helvetica").fontSize(10)
    .text(`Venue: ${quotation.enquiry.venueType ?? "To be confirmed"}`, 319, panelTop + 39)
    .text(`Menu: ${quotation.menuPackage.name}`, 319, panelTop + 56)
    .text(`Price per plate: ${money(quotation.pricePerPlate)}`, 319, panelTop + 73);
  doc.y = panelTop + 120;

  sectionHeading(doc, "SELECTED MENU", maroon, gold);
  const grouped = groupByCategory(quotation.menuPackage.items);
  for (const [category, items] of Object.entries(grouped)) {
    doc.fillColor(maroon).font("Helvetica-Bold").fontSize(10).text(category.toUpperCase());
    doc.fillColor(muted).font("Helvetica").fontSize(9).text(items.map((i) => i.menuItem.name).join("  •  "), { indent: 10 });
    doc.moveDown(0.25);
  }
  doc.moveDown();

  sectionHeading(doc, "INVESTMENT SUMMARY", maroon, gold);
  const rows = [
    ["Food cost", quotation.foodCost], ["Staff cost", quotation.staffCost],
    ["Equipment cost", quotation.equipmentCost], ["Transportation cost", quotation.transportationCost],
    ["Decoration and other services", Number(quotation.decorationCost) + Number(quotation.otherServicesCost)],
    ["Subtotal", quotation.subtotal], [`Tax (${quotation.taxPercent}%)`, quotation.taxAmount],
  ] as const;
  for (const [label, amount] of rows) addTableRow(doc, label, money(amount), false, ink, muted);
  addTableRow(doc, "TOTAL AMOUNT", money(quotation.totalAmount), true, maroon, maroon);
  addTableRow(doc, "Advance payable", money(quotation.advanceAmount), false, ink, muted);
  doc.moveDown();

  sectionHeading(doc, "TERMS & CONDITIONS", maroon, gold);
  doc.fillColor(muted).font("Helvetica").fontSize(8.5).text(quotation.termsAndConditions ?? "Standard terms apply.", { lineGap: 3 });
  doc.moveDown();

  sectionHeading(doc, "CANCELLATION POLICY", maroon, gold);
  doc.fillColor(muted).font("Helvetica").fontSize(8.5).text(quotation.cancellationPolicy ?? "Standard cancellation policy applies.", { lineGap: 3 });

  doc.moveTo(44, 770).lineTo(551, 770).strokeColor(gold).lineWidth(1).stroke();
  doc.fillColor(maroon).font("Helvetica-Bold").fontSize(9).text("VIVAH CATERERS", 44, 782);
  doc.fillColor(muted).font("Helvetica").fontSize(8).text("Thank you for trusting us with your celebration.", 170, 782);

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return `/quotations/${quotation.quotationNumber}.pdf`;
}

function sectionHeading(doc: PDFKit.PDFDocument, title: string, maroon: string, gold: string) {
  doc.fillColor(maroon).font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveTo(44, doc.y + 4).lineTo(551, doc.y + 4).strokeColor(gold).lineWidth(1).stroke();
  doc.moveDown(0.7);
}

function addTableRow(
  doc: PDFKit.PDFDocument,
  label: string,
  amount: string,
  emphasized: boolean,
  labelColor: string,
  amountColor: string,
) {
  const y = doc.y;
  if (emphasized) doc.roundedRect(44, y - 4, 507, 25, 4).fill("#fbf6ed");
  doc.fillColor(labelColor).font(emphasized ? "Helvetica-Bold" : "Helvetica").fontSize(emphasized ? 10 : 9.5).text(label, 54, y);
  doc.fillColor(amountColor).font("Helvetica-Bold").fontSize(emphasized ? 10 : 9.5).text(amount, 390, y, { width: 150, align: "right" });
  doc.y = y + (emphasized ? 29 : 21);
}

function money(amount: unknown) {
  return `Rs. ${Number(amount).toFixed(2)}`;
}

function groupByCategory(items: ItemWithCategory[]) {
  return items.reduce<Record<string, ItemWithCategory[]>>((acc, item) => {
    const key = item.menuItem.category.name;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}
