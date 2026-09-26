import { app } from "./app";
import { env } from "./config/env";
import { schedulePaymentReminders } from "./modules/payment/payment.reminder";
import { bootstrapOwner } from "./modules/auth/auth.service";

app.listen(env.port, () => {
  console.log(`CateringAI backend listening on port ${env.port} (${env.nodeEnv})`);
  schedulePaymentReminders();
  bootstrapOwner().catch((err) => console.error("[auth] Failed to bootstrap owner account", err));
});
