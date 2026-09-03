import type { ProfileRole } from "@/types/inquiry";

export const INQUIRY_MENU_NOTIFICATION_UPDATED_EVENT = "inquiry-menu-notification-updated";

export type InquiryMenuBadge = {
  label: string;
  tone: "answer" | "pending";
};

export const getInquiryNotificationFilter = (role: ProfileRole, userId: string) =>
  role === "ADMIN"
    ? { status: "PENDING" as const, userId: null, requiresUnreadAnswer: false }
    : { status: "ANSWERED" as const, userId, requiresUnreadAnswer: true };

export const getInquiryMenuBadge = (
  role: ProfileRole,
  count: number,
): InquiryMenuBadge | null => {
  if (count < 1) return null;

  return role === "ADMIN"
    ? { label: `대기 ${count}`, tone: "pending" }
    : { label: `답변 ${count}`, tone: "answer" };
};
