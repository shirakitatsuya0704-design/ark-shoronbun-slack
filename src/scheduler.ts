import { App } from "@slack/bolt";
import { generateDailyContent } from "./generators/content";
import { buildArticleBlocks } from "./blocks/article";
import { config } from "./config";

export async function postDailyContent(app: App): Promise<void> {
  console.log(`[${new Date().toISOString()}] Generating daily content (lang=${config.lang})...`);

  const content = await generateDailyContent();
  const fallbackText = `${content.category} | ${content.title}\n\n${content.intro}\n\n${content.question}`;

  // 先生チャンネルに投稿
  await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: config.slack.teacherChannelId,
    text: fallbackText,
    blocks: buildArticleBlocks(content, config.lang, true),
  });
  console.log(`[${new Date().toISOString()}] Posted to teacher channel: "${content.title}"`);

  // 生徒チャンネルに順番に投稿
  for (const channelId of config.slack.studentChannelIds) {
    try {
      await app.client.chat.postMessage({
        token: config.slack.botToken,
        channel: channelId,
        text: fallbackText,
        blocks: buildArticleBlocks(content, config.lang, false),
      });
      console.log(`[${new Date().toISOString()}] Posted to student channel: ${channelId}`);
    } catch (err) {
      console.error(`Failed to post to student channel ${channelId}:`, err);
    }
  }

  // 生徒ユーザーにDM送信
  for (const userId of config.slack.studentUserIds) {
    try {
      const dm = await app.client.conversations.open({
        token: config.slack.botToken,
        users: userId,
      });
      const dmChannelId = dm.channel?.id;
      if (!dmChannelId) throw new Error("DM channel not found");
      await app.client.chat.postMessage({
        token: config.slack.botToken,
        channel: dmChannelId,
        text: fallbackText,
        blocks: buildArticleBlocks(content, config.lang, false),
      });
      console.log(`[${new Date().toISOString()}] DM sent to user: ${userId}`);
    } catch (err) {
      console.error(`Failed to DM user ${userId}:`, err);
    }
  }
}
