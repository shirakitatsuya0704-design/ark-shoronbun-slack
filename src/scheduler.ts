import { App } from "@slack/bolt";
import { generateDailyContent } from "./generators/content";
import { buildArticleBlocks } from "./blocks/article";
import { config } from "./config";

function getDailyNotification(lang: string): string {
  const tokyoDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  if (lang === "ja") {
    const y = tokyoDate.getFullYear();
    const m = tokyoDate.getMonth() + 1;
    const d = tokyoDate.getDate();
    return `<!channel> 📍 ${y}年${m}月${d}日のDaily Ark Newsです ✉️`;
  } else {
    const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    const date = tokyoDate.toLocaleDateString("en-US", opts);
    return `<!channel> 📍 Daily Ark News for ${date} ✉️`;
  }
}

async function postToChannelWithThread(
  app: App,
  channelId: string,
  notificationText: string,
  fallbackText: string,
  blocks: ReturnType<typeof buildArticleBlocks>
): Promise<void> {
  // チャンネルに1行通知を投稿
  const notif = await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: channelId,
    text: notificationText,
  });

  // その通知のスレッドにニュース本文を投稿
  await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: channelId,
    thread_ts: notif.ts as string,
    text: fallbackText,
    blocks,
  });
}

export async function postDailyContent(app: App): Promise<void> {
  console.log(`[${new Date().toISOString()}] Generating daily content (lang=${config.lang})...`);

  const content = await generateDailyContent();
  const fallbackText = `${content.category} | ${content.title}\n\n${content.intro}\n\n${content.question}`;
  const notificationText = getDailyNotification(config.lang);

  // 先生チャンネルはトップレベル投稿（スレッドなし）
  await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: config.slack.teacherChannelId,
    text: fallbackText,
    blocks: buildArticleBlocks(content, config.lang, true),
  });
  console.log(`[scheduler] Posted to teacher channel: "${content.title}"`);

  // 生徒チャンネル：通知1行 → スレッドにニュース本文
  const studentBlocks = buildArticleBlocks(content, config.lang, false);

  for (const channelId of config.slack.studentChannelIds) {
    try {
      await postToChannelWithThread(app, channelId, notificationText, fallbackText, studentBlocks);
      console.log(`[scheduler] Posted to student channel: ${channelId}`);
    } catch (err) {
      console.error(`Failed to post to student channel ${channelId}:`, err);
    }
  }

  // 生徒ユーザーにDM：通知1行 → スレッドにニュース本文
  for (const userId of config.slack.studentUserIds) {
    try {
      const dm = await app.client.conversations.open({
        token: config.slack.botToken,
        users: userId,
      });
      const dmChannelId = dm.channel?.id;
      if (!dmChannelId) throw new Error("DM channel not found");

      await postToChannelWithThread(app, dmChannelId, notificationText, fallbackText, studentBlocks);
      console.log(`[scheduler] DM sent to user: ${userId}`);
    } catch (err) {
      console.error(`Failed to DM user ${userId}:`, err);
    }
  }
}
