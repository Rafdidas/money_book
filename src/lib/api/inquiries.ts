import { supabase } from "@/lib/supabase/client";
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

export const INQUIRIES_PAGE_SIZE = 20;

export const getInquiries = async (
  page: number,
  pageSize = INQUIRIES_PAGE_SIZE,
): Promise<{ items: Inquiry[]; hasMore: boolean }> => {
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, pageSize);
  const start = safePage * safePageSize;

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .range(start, start + safePageSize);

  if (error) throw new Error(error.message);

  const items = ((data || []) as Inquiry[]).slice(0, safePageSize);

  return { items, hasMore: (data || []).length > safePageSize };
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
    })
    .eq("id", inquiryId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Inquiry;
};
