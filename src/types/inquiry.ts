export type InquiryStatus = "PENDING" | "ANSWERED";
export type ProfileRole = "USER" | "ADMIN";

export type Inquiry = {
  id: string;
  user_id: string;
  user_email: string | null;
  title: string;
  content: string;
  status: InquiryStatus;
  answer_title: string | null;
  answer_content: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
};
