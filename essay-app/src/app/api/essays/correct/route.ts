import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getStudent,
  getRecentEssayHistories,
  createEssayHistory,
  updateStudentProfile,
} from '@/lib/supabase';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt';
import type { EssayLevel, CorrectionResult } from '@/types';

// モジュールロード時ではなく呼び出し時に初期化（env var の確実な読み込みのため）
const getAnthropic = () => new Anthropic({ apiKey: process.env.ARK_ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    // 1. リクエストのバリデーション
    const body = await req.json();
    const { student_id, theme, level, submitted_text } = body as {
      student_id: string;
      theme: string;
      level: EssayLevel;
      submitted_text: string;
    };

    if (!student_id || !theme || !level || !submitted_text) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // 2. DBから生徒情報と直近3件の添削履歴を取得
    const [student, histories] = await Promise.all([
      getStudent(student_id),
      getRecentEssayHistories(student_id, 3),
    ]);

    if (!student) {
      return NextResponse.json({ error: '生徒が見つかりません' }, { status: 404 });
    }

    // 3. プロンプトを構築
    const userPrompt = buildUserPrompt({
      student,
      histories,
      theme,
      level,
      submittedText: submitted_text,
    });

    // 4. Anthropic API に添削を依頼
    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // 5. レスポンスをパース
    const rawText = message.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('');

    // JSONブロックを抽出（```json ... ``` にも対応）
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ||
                      rawText.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      console.error('AI response parse error:', rawText);
      return NextResponse.json({ error: 'AI応答のパースに失敗しました' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[1]) as {
      feedback: string;
      strengths: string;
      weaknesses: string;
      score: number;
      updated_profile_summary: string;
    };

    // 6. 添削結果をDBに保存
    await createEssayHistory({
      student_id,
      theme,
      level,
      submitted_text,
      ai_feedback: parsed.feedback,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      score: parsed.score,
    });

    // 7. 生徒のプロファイルサマリーを最新に更新
    await updateStudentProfile(student_id, parsed.updated_profile_summary);

    // 8. フロントエンドに返却
    const result: CorrectionResult = {
      feedback: parsed.feedback,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      score: parsed.score,
      updated_profile_summary: parsed.updated_profile_summary,
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error('Correction error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
