import type { KnownBlock } from "@slack/web-api";
import { DailyContent } from "../generators/content";
import { Lang } from "../config";

const labels: Record<Lang, { sources: string; question: string; studentHint: string; teacherHint: string; readMore: string }> = {
  ja: {
    sources: "📰 今日のニュース（3本）",
    question: "💭 今日の問い",
    studentHint: "💬 このスレッドに自分の考えを書いて送ってください！回答に @shoronbun-ja をメンションするとフィードバックが届きます。",
    teacherHint: "👩‍🏫 生徒の回答をスレッドに貼り付けて @shoronbun-ja をメンションすると、思考深化のFB案を生成します",
    readMore: "記事を読む",
  },
  en: {
    sources: "📰 Today's News (3 Articles)",
    question: "💭 Today's Question",
    studentHint: "💬 Write your thoughts in this thread! Mention @shoronbun-en in your reply to get instant feedback.",
    teacherHint: "👩‍🏫 Paste the student's answer in thread and mention @shoronbun-en to generate feedback suggestions",
    readMore: "Read article",
  },
};

export function buildArticleBlocks(content: DailyContent, lang: Lang, isTeacherChannel: boolean): KnownBlock[] {
  const l = labels[lang];

  const blocks: KnownBlock[] = [
    // ブランドヘッダー
    {
      type: "context",
      elements: [
        {
          type: "image",
          image_url: "https://ark-collegejp.com/wp-content/uploads/2024/03/ark-college-logo.png",
          alt_text: "Ark College",
        },
        { type: "mrkdwn", text: `*Daily Ark News*　|　${content.category}` },
      ],
    },
    // 記事タイトル
    {
      type: "header",
      text: { type: "plain_text", text: content.title, emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: content.intro },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${l.sources}*` },
    },
  ];

  content.sources.forEach((src, i) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${i + 1}. ${src.title}*`,
      },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: l.readMore, emoji: false },
        url: src.url,
        action_id: `read_article_${i}`,
      },
    });
  });

  blocks.push({ type: "divider" });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${l.question}*\n\n> ${content.question}`,
    },
  });

  blocks.push({ type: "divider" });

  // 先生チャンネルと生徒チャンネルでヒントを出し分ける
  blocks.push({
    type: "context",
    elements: [{
      type: "mrkdwn",
      text: isTeacherChannel ? l.teacherHint : l.studentHint,
    }],
  });

  return blocks;
}
