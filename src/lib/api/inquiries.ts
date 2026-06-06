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

export const getInquiries = async () => {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as Inquiry[];
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
