export type EssayLevel = '初級' | '中級' | '上級' | '超上級';

export type Grade =
  | '中1' | '中2' | '中3'
  | '高1' | '高2' | '高3'
  | '高卒生' | 'その他';

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  current_level: EssayLevel;
  profile_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface EssayHistory {
  id: string;
  student_id: string;
  theme: string;
  level: EssayLevel;
  submitted_text: string;
  ai_feedback: string | null;
  strengths: string | null;
  weaknesses: string | null;
  score: number | null;
  created_at: string;
}

export interface EssayHistoryWithStudent extends EssayHistory {
  students: Pick<Student, 'name' | 'grade'>;
}

export interface CorrectionRequest {
  student_id: string;
  theme: string;
  level: EssayLevel;
  submitted_text: string;
}

export interface CorrectionResult {
  feedback: string;
  strengths: string;
  weaknesses: string;
  score: number;
  updated_profile_summary: string;
}
