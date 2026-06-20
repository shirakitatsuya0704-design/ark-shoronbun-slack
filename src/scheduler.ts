import { App } from "@slack/bolt";
import { generateDailyContent } from "./generators/content";
import { buildArticleBlocks } from "./blocks/article";
import { config } from "./config";

const ANCHOR_TEXT: Record<string, string> = {
  ja: "【Daily Ark News スレッド】",
  en: "【Daily Ark News Thread】",
};

const ANCHOR_BODY: Record<string, string> = {
  ja: "📌 毎日のニュースはこのスレッド内に届きます。スレッドを開いて読んでください。",
  en: "📌 Daily news arrives inside this thread. Open it each day to read.",
};

async function getOrCreateAnchorTs(app: App, channelId: string): Promise<string> {
  const marker = ANCHOR_TEXT[config.lang];

  const history = await app.client.conversations.history({
    token: config.slack.botToken,
    channel: channelId,
    limit: 200,
  });

  const anchor = history.messages?.find((m) => m.text?.includes(marker));
  if (anchor?.ts) {
    console.log(`[scheduler] Found anchor in ${channelId}: ${anchor.ts}`);
    return anchor.ts;
  }

  const result = await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: channelId,
    text: marker,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${marker}*\n${ANCHOR_BODY[config.lang]}` },
      },
    ],
  });

  console.log(`[scheduler] Created anchor in ${channelId}: ${result.ts}`);
  return result.ts as string;
}

export async function postDailyContent(app: App): Promise<void> {
  console.log(`[${new Date().toISOString()}] Generating daily content (lang=${config.lang})...`);

  const content = await generateDailyContent();
  const fallbackText = `${content.category} | ${content.title}\n\n${content.intro}\n\n${content.question}`;

  // 先生チャンネルはトップレベル投稿（スレッドなし）
  await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: config.slack.teacherChannelId,
    text: fallbackText,
    blocks: buildArticleBlocks(content, config.lang, true),
  });
  console.log(`[scheduler] Posted to teacher channel: "${content.title}"`);

  // 生徒チャンネル：固定スレッドに返信（@here付き）
  for (const channelId of config.slack.studentChannelIds) {
    try {
      const threadTs = await getOrCreateAnchorTs(app, channelId);
      await app.client.chat.postMessage({
        token: config.slack.botToken,
        channel: channelId,
        thread_ts: threadTs,
        text: `<!channel> ${fallbackText}`,
        blocks: buildArticleBlocks(content, config.lang, false),
      });
      console.log(`[scheduler] Posted thread reply to ${channelId}`);
    } catch (err) {
      console.error(`Failed to post to student channel ${channelId}:`, err);
    }
  }

  // 生徒ユーザーにDM：固定スレッドに返信
  for (const userId of config.slack.studentUserIds) {
    try {
      const dm = await app.client.conversations.open({
        token: config.slack.botToken,
        users: userId,
      });
      const dmChannelId = dm.channel?.id;
      if (!dmChannelId) throw new Error("DM channel not found");

      const threadTs = await getOrCreateAnchorTs(app, dmChannelId);
      await app.client.chat.postMessage({
        token: config.slack.botToken,
        channel: dmChannelId,
        thread_ts: threadTs,
        text: fallbackText,
        blocks: buildArticleBlocks(content, config.lang, false),
      });
      console.log(`[scheduler] DM thread reply sent to ${userId}`);
    } catch (err) {
      console.error(`Failed to DM user ${userId}:`, err);
    }
  }
}
