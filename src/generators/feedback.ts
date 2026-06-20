import Anthropic from "@anthropic-ai/sdk";
import { config, Lang } from "../config";

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

export interface FeedbackRequest {
  articleTitle: string;
  articleBody: string;
  question: string;
  studentAnswer: string;
}

const systemPrompts: Record<Lang, string> = {
  ja: `あなたはアークカレッジの教師アシスタントです。
生徒が書いたニュースへの要約・原因分析・解決策に対して、採点とフィードバックを行います。

【採点基準（各10点・合計30点）】
① 要約力：記事の重要な点を自分の言葉で正確にまとめられているか
② 原因分析：問題の一番大きな原因を的確に捉えられているか
③ 解決策の質：実行可能で効果のある解決策が論理的に示されているか

【フィードバックの方針】
・採点は客観的・公平に行う
・各軸について「理想の状態 → 現状の評価 → 次回の改善点」の形式で伝える
・生徒を励ます温かいトーンで、です・ます調で書く
・先生向けのメモは一切含めない`,

  en: `You are a teaching assistant at Ark College.
CRITICAL RULE: You MUST respond in English only. Never use Japanese.

Score and give feedback on the student's summary, cause analysis, and solution proposal.

Scoring criteria (10 points each, 30 points total):
① Summary: Are the key points of the article captured accurately in their own words?
② Cause analysis: Is the biggest cause of the issue correctly identified?
③ Solution quality: Is the proposed solution feasible, effective, and logically explained?

Feedback approach:
- Score objectively and fairly
- For each axis, follow this format: "Ideal state → Current evaluation → What to improve next time"
- Use a warm, encouraging tone
- Do NOT include any teacher's notes or internal memos`,
};

function buildUserPrompt(lang: Lang, req: FeedbackRequest): string {
  if (lang === "ja") {
    return `## 今日のお題
${req.question}

## 生徒の回答
${req.studentAnswer}

---
以下の形式でフィードバックしてください：

📊 *採点結果*
① 要約力：X/10
② 原因分析：X/10
③ 解決策の質：X/10
*合計：XX/30点*

---

📝 *① 要約力のフィードバック*
・理想：（この軸での理想の状態を1文で）
・現状：（生徒の回答に対する評価を1〜2文で）
・次回：（次回意識してほしい改善点を1文で）

📝 *② 原因分析のフィードバック*
・理想：（この軸での理想の状態を1文で）
・現状：（生徒の回答に対する評価を1〜2文で）
・次回：（次回意識してほしい改善点を1文で）

📝 *③ 解決策のフィードバック*
・理想：（この軸での理想の状態を1文で）
・現状：（生徒の回答に対する評価を1〜2文で）
・次回：（次回意識してほしい改善点を1文で）`;
  }

  return `## Today's Question
${req.question}

## Student's Answer
${req.studentAnswer}

---
Please provide feedback in English only using this format:

📊 *Score*
① Summary: X/10
② Cause analysis: X/10
③ Solution quality: X/10
*Total: XX/30*

---

📝 *① Summary Feedback*
・Ideal: (What an ideal summary looks like, in 1 sentence)
・Current: (Evaluation of the student's summary in 1-2 sentences)
・Next time: (One specific thing to improve next time)

📝 *② Cause Analysis Feedback*
・Ideal: (What ideal cause analysis looks like, in 1 sentence)
・Current: (Evaluation of the student's analysis in 1-2 sentences)
・Next time: (One specific thing to improve next time)

📝 *③ Solution Feedback*
・Ideal: (What an ideal solution looks like, in 1 sentence)
・Current: (Evaluation of the student's solution in 1-2 sentences)
・Next time: (One specific thing to improve next time)`;
}

export async function generateFeedback(req: FeedbackRequest): Promise<string> {
  console.log(`[feedback] lang=${config.lang}`);
  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 1200,
    system: systemPrompts[config.lang],
    messages: [{ role: "user", content: buildUserPrompt(config.lang, req) }],
  });

  return (message.content[0] as Anthropic.TextBlock).text.trim();
}
