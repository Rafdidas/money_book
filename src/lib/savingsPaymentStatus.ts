import type { PaymentStatus, SavingsPayment } from "@/types/recurring";

export const getEffectiveSavingsPaymentStatus = (
  payment: Pick<SavingsPayment, "status" | "payment_date">,
  todayKey: string,
): PaymentStatus =>
  payment.status === "scheduled" && payment.payment_date <= todayKey
    ? "paid"
    : payment.status;
