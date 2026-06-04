import Anthropic from "@anthropic-ai/sdk";
import { config, Lang } from "../config";

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

export interface FeedbackRequest {
  articleTitle: string;
  articleBody: string;
  question: string;
  studentAnswer: string;
}

// このFBは先生（ノア先生）が生徒に返す内容を作るためのアシスタント
// 目的：小論文の添削ではなく「思考を深める」ための問いかけ・視点提示
const systemPrompts: Record<Lang, string> = {
  ja: `あなたはアークカレッジの教師アシスタントです。
生徒が書いたニュースへの意見に対して、思考をさらに深めるためのFB案を作成します。

【FBの目的】
「ニュースを読んで意見を述べる」活動は、思考力・問いを立てる力を鍛えるためのものです。
文章の上手さや構成を評価するのではなく、「もっと深く考えるための問いかけ」をしてください。

【FBの方針】
・「〜という観点もあるのでは？」と別の視点を提示する
・「なぜそう考えたの？」と思考の根拠を掘り下げる
・「〜についてはどう思う？」と関連する問いを投げかける
・生徒の意見を否定せず、考えを広げる・深める方向でFBする
・です・ます調で書く（「〜ですね」「〜と思います」「〜はどうでしょう？」）

このFBは先生が確認・編集してから生徒に送るため、FB案として提示してください。`,

  en: `You are a teaching assistant at Ark College.
CRITICAL RULE: You MUST respond in English only. Never use Japanese. Even if the student wrote in Japanese, your response must be entirely in English.

Create feedback suggestions that help students think more deeply about the news.

Purpose: This activity is about building critical thinking, not essay writing skills.
Focus on asking questions that deepen thinking, not evaluating writing quality.

Feedback approach:
- Offer alternative perspectives: "Have you considered X?"
- Probe their reasoning: "Why do you think that?"
- Ask follow-up questions: "What about Y?"
- Never dismiss their opinion — expand and deepen it
- Use a warm, conversational tone (like a teacher talking to a student)
- Keep language simple and encouraging for high school students

This feedback will be reviewed and edited by the teacher before sending to the student.`,
};

function buildUserPrompt(lang: Lang, req: FeedbackRequest): string {
  if (lang === "ja") {
    return `## 今日のお題
${req.question}

## 生徒の回答
${req.studentAnswer}

---
上記の生徒の回答に対して、思考を深めるFB案を作成してください。

【形式】（先生が生徒に送るメッセージとして書く）

*💬 FB案*

（生徒の意見を受け止める一言）

（視点を広げる問いかけ or 別の観点の提示）1〜2点

（最後に考えを深める問いを1つ）

---
*🔍 先生向けメモ*
（この生徒の回答で注目すべき点・深掘りポイントをひとこと）`;
  }

  return `## Today's Question
${req.question}

## Student's Answer
${req.studentAnswer}

---
Create a feedback suggestion in English that deepens the student's thinking.
Write everything in English only — even if the student wrote in Japanese.

Format (written as a message from teacher to student):

*💬 Feedback draft*

(Acknowledge their opinion in one sentence)

(1-2 questions or alternative perspectives to broaden thinking)

(One closing question to deepen reflection)

---
*🔍 Teacher's note*
(Brief note in English on what's noteworthy about this student's answer and what to probe further)`;
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
