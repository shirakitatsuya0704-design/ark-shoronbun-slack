import { createClient } from '@supabase/supabase-js';
import type { Student, EssayHistory, EssayLevel, Grade } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// クライアントサイド用（匿名キー）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイド用（サービスロールキー）— API Route 内でのみ使用
export const getAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
};

// ---- 生徒: 一覧 -------------------------------------------------------

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await getAdmin()
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Student[];
}

// ---- 生徒: 1件取得 -----------------------------------------------------

export async function getStudent(id: string): Promise<Student | null> {
  const { data, error } = await getAdmin()
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Student;
}

// ---- 生徒: 新規作成 -----------------------------------------------------

export async function createStudent(input: {
  name: string;
  grade: Grade;
  current_level: EssayLevel;
}): Promise<Student> {
  const { data, error } = await getAdmin()
    .from('students')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Student;
}

// ---- 生徒: プロファイル更新 ----------------------------------------------

export async function updateStudentProfile(
  id: string,
  profile_summary: string,
  current_level?: EssayLevel
): Promise<void> {
  const patch: Record<string, unknown> = { profile_summary };
  if (current_level) patch.current_level = current_level;

  const { error } = await getAdmin()
    .from('students')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

// ---- 小論文履歴: 一覧 ---------------------------------------------------

export async function getEssayHistories(studentId: string): Promise<EssayHistory[]> {
  const { data, error } = await getAdmin()
    .from('essay_histories')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as EssayHistory[];
}

// ---- 小論文履歴: 直近N件（AI添削コンテキスト用） -------------------------

export async function getRecentEssayHistories(
  studentId: string,
  limit = 3
): Promise<EssayHistory[]> {
  const { data, error } = await getAdmin()
    .from('essay_histories')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as EssayHistory[];
}

// ---- 小論文履歴: 保存 ---------------------------------------------------

export async function createEssayHistory(input: {
  student_id: string;
  theme: string;
  level: EssayLevel;
  submitted_text: string;
  ai_feedback: string;
  strengths: string;
  weaknesses: string;
  score: number;
}): Promise<EssayHistory> {
  const { data, error } = await getAdmin()
    .from('essay_histories')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as EssayHistory;
}
