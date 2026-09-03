import { supabase } from "@/lib/supabase/client";
import { getInquiryNotificationFilter } from "@/lib/inquiryMenu";
import type { Inquiry, ProfileRole } from "@/types/inquiry";

const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  return user;
};

export const getCurrentProfileRole = async (): Promise<ProfileRole> => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);

  return data.role as ProfileRole;
};

export const getInquiryMenuNotification = async (): Promise<{
  role: ProfileRole;
  count: number;
}> => {
  const user = await getCurrentUser();
  const role = await getCurrentProfileRole();
  const filter = getInquiryNotificationFilter(role, user.id);

  let query = supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", filter.status);

  if (filter.userId) query = query.eq("user_id", filter.userId);
  if (filter.requiresUnreadAnswer) query = query.is("answer_read_at", null);

  const { count, error } = await query;

  if (error) throw new Error(error.message);

  return { role, count: count ?? 0 };
};

export const INQUIRIES_PAGE_SIZE = 20;

export type InquiryCursor = {
  createdAt: string;
  id: string;
};

export const getInquiries = async (
  cursor?: InquiryCursor,
  pageSize = INQUIRIES_PAGE_SIZE,
): Promise<{ items: Inquiry[]; hasMore: boolean; nextCursor: InquiryCursor | null }> => {
  const safePageSize = Math.max(1, pageSize);

  let query = supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query.range(0, safePageSize);

  if (error) throw new Error(error.message);

  const items = ((data || []) as Inquiry[]).slice(0, safePageSize);
  const hasMore = (data || []).length > safePageSize;
  const lastItem = items.at(-1);

  return {
    items,
    hasMore,
    nextCursor:
      hasMore && lastItem
        ? { createdAt: lastItem.created_at, id: lastItem.id }
        : null,
  };
};

export const createInquiry = async (payload: { title: string; content: string }) => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      user_id: user.id,
      user_email: user.email || "",
      title: payload.title.trim(),
      content: payload.content.trim(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Inquiry;
};

export const answerInquiry = async (
  inquiryId: string,
  payload: { answerTitle: string; answerContent: string },
) => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status: "ANSWERED",
      answer_title: payload.answerTitle.trim(),
      answer_content: payload.answerContent.trim(),
      answered_by: user.id,
      answered_at: new Date().toISOString(),
      answer_read_at: null,
    })
    .eq("id", inquiryId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Inquiry;
};

export const markInquiryAnswerAsRead = async (inquiryId: string) => {
  const { error } = await supabase.rpc("mark_inquiry_answer_as_read", {
    p_inquiry_id: inquiryId,
  });

  if (error) throw new Error(error.message);
};
