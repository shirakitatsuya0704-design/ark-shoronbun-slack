import type { Student, EssayHistory, EssayLevel } from '@/types';

// レベルごとの評価基準（ワークシートの要件から抽出）
const LEVEL_CRITERIA: Record<EssayLevel, string> = {
  初級: `
【初級の評価基準】
- 字数：400〜600字
- 立場（賛成/反対）が冒頭で明示されているか
- 理由が「第一に〜」「第二に〜」と2点構成になっているか
- 具体例が最低1つ入っているか
- 結論で締めているか
- 基本的な文章表現（主語と述語のねじれ、接続詞の使い方）
`.trim(),

  中級: `
【中級の評価基準】
- 字数：600〜900字
- 序論・本論・結論の三段構成が明確か
- 主張に対する根拠が論理的に展開されているか
- 反対意見への言及があるか
- 抽象論に留まらず具体的な事例・データを使えているか
- 表現の正確性と語彙の豊かさ
`.trim(),

  上級: `
【上級の評価基準】
- 字数：800〜1200字
- 問いを自ら分解・定義できているか
- 利害関係者・多角的視点の分析があるか
- 反対意見 → 再反論（譲歩→反駁）の構造が成立しているか
- 社会的文脈・データ・引用の適切な使用
- 結論が「条件付き（留保）」の形で書けているか
- 論述の一貫性と論理の深度
`.trim(),

  超上級: `
【超上級の評価基準】
- 字数：1200〜1600字
- 問いの分解と「言えること/言えないこと」の峻別ができているか
- 利害関係者を3者以上分析しているか
- 代替案を最低2案提示し比較・優先案を示せているか
- 反対意見 → 再反論（譲歩→反駁）が哲学的深度で展開されているか
- 評価指標（KPI）2つ以上・コスト試算1つ以上の政策設計があるか
- 資料の読み取り精度（資料間の矛盾・補完関係への言及）
- 結論が「条件付き」かつ倫理的・社会的示唆を含むか
`.trim(),
};

// 過去の添削履歴を読みやすい形式に整形
function formatHistory(h: EssayHistory, index: number): string {
  return `
【過去の添削 ${index + 1}件目】
- テーマ：${h.theme}
- レベル：${h.level}
- スコア：${h.score ?? '未採点'}点
- 強み：${h.strengths ?? 'なし'}
- 課題・弱点：${h.weaknesses ?? 'なし'}
- 提出文（冒頭200字）：${h.submitted_text.slice(0, 200)}…
`.trim();
}

// システムプロンプト
export const SYSTEM_PROMPT = `
あなたはアークカレッジ（総合型選抜専門塾）の超エキスパート小論文講師です。
20年以上の指導経験を持ち、難関大学の小論文入試を知り尽くしています。

あなたの添削の特徴：
1. 論理的かつ哲学的 — 表面的な文章の上手い下手ではなく、思考の深さと論理構造を本質的に評価する
2. 個別最適化 — 生徒の過去の弱点・癖を踏まえ、「今回の成長点」と「今後の重点課題」を明確に示す
3. 具体的 — 「もっと具体的に」ではなく、「例えばここでは○○という事例を使うとよい」と具体的に指示する
4. 前向き — 批判するだけでなく、「なぜそうすると良いのか」の理由を常に添える

出力は必ず以下のJSON形式で返してください。JSONのみを出力し、前後の説明文は不要です。
{
  "feedback": "総合フィードバック（500〜800字程度。論理的・哲学的に。生徒の思考の癖を踏まえた個別コメントを含む）",
  "strengths": "今回評価できる点（箇条書き、改行区切り、3〜5点）",
  "weaknesses": "今回の課題・改善が必要な点（箇条書き、改行区切り、3〜5点）",
  "score": 整数（0〜100。レベル基準に対する達成度）,
  "updated_profile_summary": "この生徒の最新プロファイル（200〜300字。今回の添削結果を踏まえて更新。強み・弱点・思考の癖・今後の重点課題を含む）"
}
`.trim();

// ユーザープロンプトを生成
export function buildUserPrompt(params: {
  student: Student;
  histories: EssayHistory[];
  theme: string;
  level: EssayLevel;
  submittedText: string;
}): string {
  const { student, histories, theme, level, submittedText } = params;

  const profileSection = student.profile_summary
    ? `# 生徒プロファイル（過去のAI分析による蓄積データ）\n${student.profile_summary}`
    : `# 生徒プロファイル\n※ 初回添削のため過去データなし。今回の答案から初期プロファイルを生成してください。`;

  const historiesSection =
    histories.length > 0
      ? `# 過去の添削履歴（直近${histories.length}件）\n${histories.map(formatHistory).join('\n\n')}`
      : `# 過去の添削履歴\n※ なし（今回が初回）`;

  return `
# 添削対象
- 生徒名：${student.name}（${student.grade}）
- 現在のレベル：${student.current_level}
- 今回の難易度：${level}
- 課題テーマ：${theme}

${profileSection}

${historiesSection}

${LEVEL_CRITERIA[level]}

# 今回の生徒の解答
${submittedText}

---
上記を踏まえ、「この生徒の過去の思考の癖や弱点を意識しつつ、今回の成長点と今後の注意点を論理的かつ哲学的に指摘する」添削を行ってください。
指定のJSON形式で出力してください。
`.trim();
}
