import { app } from "./app";
import { env } from "./config/env";
import { schedulePaymentReminders } from "./modules/payment/payment.reminder";

app.listen(env.port, () => {
  console.log(`CateringAI backend listening on port ${env.port} (${env.nodeEnv})`);
  schedulePaymentReminders();
});
