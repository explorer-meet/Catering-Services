import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:4000",

  databaseUrl: required("DATABASE_URL"),

  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? "",

  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",

  gstPercent: Number(process.env.GST_PERCENT ?? 5),
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? "INR",

  jwtSecret: required("JWT_SECRET", process.env.NODE_ENV === "production" ? undefined : "dev-only-insecure-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  /// Used once on first boot to create the initial owner account
  bootstrapOwnerEmail: process.env.BOOTSTRAP_OWNER_EMAIL ?? "",
  bootstrapOwnerPassword: process.env.BOOTSTRAP_OWNER_PASSWORD ?? "",
  bootstrapOwnerName: process.env.BOOTSTRAP_OWNER_NAME ?? "Owner",
};
