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
生徒が書いたニュースへの意見・要約・分析に対して、採点とフィードバックを行います。

【採点基準（各10点・合計30点）】
① 記事の内容把握：記事の重要なポイントが正確に捉えられているか
② 日本語の質：正しく、ブラッシュアップされた自然な日本語で書かれているか
③ 意見・視点の明確さ：自分の考えや立場が明確に示されているか

【フィードバックの方針】
・採点は客観的・公平に行う
・改善点は一言でシンプルに伝える
・分析アイデアは「〜があるとより引き立ちますね」のように新たな視点を提示する
・生徒を励ます温かいトーンで、です・ます調で書く
・先生向けのメモは一切含めない`,

  en: `You are a teaching assistant at Ark College.
CRITICAL RULE: You MUST respond in English only. Never use Japanese.

Score and give feedback on the student's response to a news article.

Scoring criteria (10 points each, 30 points total):
① Content comprehension: Are the key points of the article accurately captured?
② English quality: Is it written in correct, polished English?
③ Clarity of opinion: Is the student's perspective clearly expressed?

Feedback approach:
- Score objectively and fairly
- Keep improvement suggestions brief
- Give 2 analysis ideas as new perspectives ("Adding X would strengthen your argument")
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
① 記事の内容把握：X/10
② 日本語の質：X/10
③ 意見・視点の明確さ：X/10
*合計：XX/30点*

✏️ *改善ポイント*
（一言でシンプルに）

💡 *分析アイデア*
・（新たな視点①：〜があるとより引き立ちますね、のような示唆）
・（新たな視点②）`;
  }

  return `## Today's Question
${req.question}

## Student's Answer
${req.studentAnswer}

---
Please provide feedback in English only using this format:

📊 *Score*
① Content comprehension: X/10
② English quality: X/10
③ Clarity of opinion: X/10
*Total: XX/30*

✏️ *One improvement tip*
(Keep it brief and specific)

💡 *Analysis ideas*
・(New perspective ①: e.g. "Adding X would strengthen your argument")
・(New perspective ②)`;
}

export async function generateFeedback(req: FeedbackRequest): Promise<string> {
  console.log(`[feedback] lang=${config.lang}`);
  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 800,
    system: systemPrompts[config.lang],
    messages: [{ role: "user", content: buildUserPrompt(config.lang, req) }],
  });

  return (message.content[0] as Anthropic.TextBlock).text.trim();
}
