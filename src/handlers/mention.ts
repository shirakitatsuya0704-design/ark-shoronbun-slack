import { App } from "@slack/bolt";
import { generateFeedback } from "../generators/feedback";
import { config } from "../config";

interface SlackMessage {
  text?: string;
  ts?: string;
  thread_ts?: string;
  username?: string;
  bot_id?: string;
}

/**
 * スレッドの履歴から「記事投稿」と「お題」を取得する
 * 最初のメッセージ（Bot 投稿）のテキストから本文とお題を抽出する
 */
async function fetchThreadContext(
  client: App["client"],
  channelId: string,
  threadTs: string
): Promise<{ articleTitle: string; articleBody: string; question: string }> {
  const result = await client.conversations.replies({
    channel: channelId,
    ts: threadTs,
    limit: 10,
  });

  const messages = (result.messages ?? []) as SlackMessage[];
  const rootMessage = messages[0];

  if (!rootMessage?.text) {
    return { articleTitle: "", articleBody: "", question: "" };
  }

  const text = rootMessage.text;

  // Slack Block Kit では text フィールドにプレーンテキストのfallbackが入る
  // ヘッダー（タイトル）は最初の行から取得
  const lines = text.split("\n").filter((l: string) => l.trim().length > 0);
  const title = lines[0] ?? "";

  // お題は引用（>）の行を探す
  const questionLine = lines.find((l: string) => l.startsWith(">")) ?? "";
  const question = questionLine.replace(/^>\s*/, "").trim();

  // 本文はタイトルとお題以外の部分
  const body = lines
    .filter((l: string) => l !== title && !l.startsWith(">"))
    .join("\n")
    .trim();

  return { articleTitle: title, articleBody: body, question };
}

export function registerMentionHandler(app: App): void {
  app.event("app_mention", async ({ event, client, say }) => {
    const threadTs = event.thread_ts ?? event.ts;
    const channelId = event.channel;
    const userText = event.text ?? "";

    // Bot 自身のメンション部分を除去して生徒の回答だけ取得
    const studentAnswer = userText
      .replace(/<@[A-Z0-9]+>/g, "")
      .trim();

    if (!studentAnswer) {
      await say({
        thread_ts: threadTs,
        text:
          config.lang === "ja"
            ? "回答が見当たりませんでした。スレッドに小論文を書いてメンションしてください！"
            : "I couldn't find your essay. Please write your answer in the thread and mention me!",
      });
      return;
    }

    // スレッドのルートメッセージから記事情報を取得
    const { articleTitle, articleBody, question } = await fetchThreadContext(
      client,
      channelId,
      threadTs
    );

    // 処理中メッセージを先に送る（UX改善）
    const loadingText =
      config.lang === "ja"
        ? "✍️ 添削中です。少々お待ちください..."
        : "✍️ Reviewing your essay, please wait a moment...";

    await say({ thread_ts: threadTs, text: loadingText });

    try {
      const feedback = await generateFeedback({
        articleTitle,
        articleBody,
        question,
        studentAnswer,
      });

      await say({ thread_ts: threadTs, text: feedback });
    } catch (err) {
      console.error("Feedback generation error:", err);
      const errText =
        config.lang === "ja"
          ? "申し訳ありません、添削の生成中にエラーが発生しました。もう一度お試しください。"
          : "Sorry, an error occurred while generating feedback. Please try again.";
      await say({ thread_ts: threadTs, text: errText });
    }
  });
}
