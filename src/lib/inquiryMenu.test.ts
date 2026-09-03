import { describe, expect, it } from "vitest";
import { getInquiryMenuBadge, getInquiryNotificationFilter } from "./inquiryMenu";

describe("getInquiryMenuBadge", () => {
  it("shows answered inquiries to a member", () => {
    expect(getInquiryMenuBadge("USER", 2)).toEqual({ label: "답변 2", tone: "answer" });
  });

  it("shows pending inquiries to an administrator", () => {
    expect(getInquiryMenuBadge("ADMIN", 3)).toEqual({ label: "대기 3", tone: "pending" });
  });

  it("does not render a badge when there are no relevant inquiries", () => {
    expect(getInquiryMenuBadge("USER", 0)).toBeNull();
    expect(getInquiryMenuBadge("ADMIN", 0)).toBeNull();
  });

  it("counts only unread answered inquiries for a member", () => {
    expect(getInquiryNotificationFilter("USER", "member-id")).toEqual({
      status: "ANSWERED",
      userId: "member-id",
      requiresUnreadAnswer: true,
    });
  });

  it("counts pending inquiries for an administrator", () => {
    expect(getInquiryNotificationFilter("ADMIN", "admin-id")).toEqual({
      status: "PENDING",
      userId: null,
      requiresUnreadAnswer: false,
    });
  });
});
