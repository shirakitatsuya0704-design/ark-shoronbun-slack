import { App } from "@slack/bolt";
import { generateFeedback } from "../generators/feedback";
import { config } from "../config";

interface SlackMessage {
  text?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
  user?: string;
}

/**
 * スレッドの全メッセージを取得して以下を抽出する
 * - 記事のタイトル・お題（ルートメッセージ）
 * - 生徒の回答（スレッド内の人間が書いたメッセージをすべて結合）
 */
async function fetchThreadContext(
  client: App["client"],
  channelId: string,
  threadTs: string,
  mentionText: string,
): Promise<{
  articleTitle: string;
  question: string;
  studentAnswer: string;
}> {
  const result = await client.conversations.replies({
    channel: channelId,
    ts: threadTs,
    limit: 20,
  });

  const messages = (result.messages ?? []) as SlackMessage[];
  const rootMessage = messages[0];

  // --- 記事のタイトルとお題をルートメッセージから抽出 ---
  const rootText = rootMessage?.text ?? "";
  const lines = rootText.split("\n").filter((l) => l.trim().length > 0);

  // タイトルは最初の行（カテゴリ | タイトル 形式）
  const titleLine = lines[0] ?? "";
  const articleTitle = titleLine.includes("|")
    ? titleLine.split("|").slice(1).join("|").trim()
    : titleLine;

  // お題は最後の段落（最後の空行以降）
  const question = lines[lines.length - 1] ?? "";

  // --- 生徒の回答を収集 ---
  // 方針: メンションテキストに実質的な内容があればそれを使う
  //       なければ、スレッド内の人間のメッセージをすべて結合する
  const strippedMention = mentionText
    .replace(/<@[A-Z0-9]+>/g, "")
    .replace(/お願い[！!]?/g, "")
    .replace(/これに対するコメントも教えて/g, "")
    .replace(/添削して[ください]*/g, "")
    .trim();

  let studentAnswer = "";

  if (strippedMention.length > 30) {
    // メンションテキスト自体に回答が含まれている場合
    studentAnswer = strippedMention;
  } else {
    // スレッド内の人間のメッセージを結合（Botのメッセージは除外）
    const humanMessages = messages
      .slice(1) // ルートメッセージ（記事）を除く
      .filter((m) => !m.bot_id) // Botのメッセージを除く
      .map((m) => (m.text ?? "").replace(/<@[A-Z0-9]+>/g, "").trim())
      .filter((t) => t.length > 10); // 短すぎる「お願い！」等を除く

    studentAnswer = humanMessages.join("\n\n");
  }

  return { articleTitle, question, studentAnswer };
}

export function registerMentionHandler(app: App): void {
  app.event("app_mention", async ({ event, client, say }) => {
    const threadTs = event.thread_ts ?? event.ts;
    const channelId = event.channel;
    const mentionText = event.text ?? "";

    // 処理中メッセージを先に返す
    await say({
      thread_ts: threadTs,
      text: config.lang === "ja"
        ? "✍️ FB案を作成中です。少々お待ちください..."
        : "✍️ Generating feedback, please wait...",
    });

    try {
      const { articleTitle, question, studentAnswer } = await fetchThreadContext(
        client,
        channelId,
        threadTs,
        mentionText,
      );

      if (!studentAnswer) {
        await say({
          thread_ts: threadTs,
          text: config.lang === "ja"
            ? "生徒の回答が見当たりませんでした。スレッドに生徒の回答が書かれているか確認してください。"
            : "No student answer found. Please check if the answer is in the thread.",
        });
        return;
      }

      const feedback = await generateFeedback({
        articleTitle,
        articleBody: "",
        question,
        studentAnswer,
      });

      await say({ thread_ts: threadTs, text: feedback });

    } catch (err) {
      console.error("Feedback generation error:", err);
      await say({
        thread_ts: threadTs,
        text: config.lang === "ja"
          ? "エラーが発生しました。もう一度お試しください。"
          : "An error occurred. Please try again.",
      });
    }
  });
}
