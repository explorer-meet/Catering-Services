import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { errorHandler } from "./common/errorHandler";
import { enquiryRouter } from "./modules/enquiry/enquiry.routes";
import { menuRouter } from "./modules/menu/menu.routes";
import { budgetRouter } from "./modules/budget/budget.routes";
import { quotationRouter } from "./modules/quotation/quotation.routes";
import { customizationRouter } from "./modules/customization/customization.routes";
import { bookingRouter } from "./modules/booking/booking.routes";
import { paymentRouter } from "./modules/payment/payment.routes";
import { whatsappRouter } from "./modules/whatsapp/whatsapp.routes";
import { categoryRouter } from "./modules/category/category.routes";
import { ingredientRouter, recipeRouter } from "./modules/ingredient/ingredient.routes";
import { vendorRouter } from "./modules/vendor/vendor.routes";
import { b2bRouter } from "./modules/b2b/b2b.routes";
import { authRouter, userRouter } from "./modules/auth/auth.routes";
import { requireAuth, requireRole } from "./common/middleware/auth";
import { rateLimit } from "./common/middleware/rateLimit";

export const app = express();

const standardMenuFiles: Record<string, string> = {
	"silver-menu.pdf": "VivahEvents_Silver_Menu.pdf",
	"gold-menu.pdf": "VivahEvents_Gold_Menu.pdf",
	"platinum-menu.pdf": "VivahEvents_Platinum_Menu.pdf",
};

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // required for Twilio webhook form posts

// Static access to generated quotation PDFs
app.use("/quotations", express.static(path.join(process.cwd(), "quotations")));

app.get("/menus/:fileName", (req, res, next) => {
	const sourceFileName = standardMenuFiles[req.params.fileName];

	if (!sourceFileName) {
		next();
		return;
	}

	res.type("application/pdf");
	res.setHeader("Content-Disposition", `inline; filename="${req.params.fileName}"`);
	res.sendFile(path.join(process.cwd(), "standard-menu", sourceFileName));
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/enquiries", enquiryRouter);
app.use("/api/menu", menuRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/quotations", quotationRouter);
app.use("/api/customization", customizationRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/whatsapp", whatsappRouter);

// ---------- Authenticated owner console ----------

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: "Too many sign-in attempts. Please try again in a few minutes.",
});

const menuStaff = [requireAuth, requireRole("OWNER", "MANAGER")];
const accountsStaff = [requireAuth, requireRole("OWNER", "MANAGER", "ACCOUNTANT")];

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRouter);
app.use("/api/admin/users", userRouter);

app.use("/api/admin/categories", menuStaff, categoryRouter);
app.use("/api/admin/ingredients", menuStaff, ingredientRouter);
app.use("/api/admin/recipes", menuStaff, recipeRouter);
app.use("/api/admin/vendors", accountsStaff, vendorRouter);
app.use("/api/admin/b2b-orders", accountsStaff, b2bRouter);

app.use(errorHandler);
