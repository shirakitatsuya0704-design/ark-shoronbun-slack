/**
 * 指定チャンネルでスレッド投稿をテストするスクリプト
 * APP_LANG=ja ts-node src/test-thread.ts で実行
 */
import { App } from "@slack/bolt";
import { config } from "./config";
import { generateDailyContent } from "./generators/content";
import { buildArticleBlocks } from "./blocks/article";

const TEST_CHANNEL = "C0B4QTJD8DQ";

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
});

(async () => {
  await app.start(config.slack.port);
  console.log(`Testing student-format post to teacher channel (lang=${config.lang})...`);

  const content = await generateDailyContent();
  const fallbackText = `${content.category} | ${content.title}`;

  const now = new Date();
  const notificationText = config.lang === "ja"
    ? `<!channel> 📍 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日のDaily Ark Newsです ✉️`
    : `<!channel> 📍 Daily Ark News for ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} ✉️`;

  // 通知1行を投稿
  const notif = await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: TEST_CHANNEL,
    text: notificationText,
  });

  // スレッドにニュース本文を投稿
  await app.client.chat.postMessage({
    token: config.slack.botToken,
    channel: TEST_CHANNEL,
    thread_ts: notif.ts as string,
    text: fallbackText,
    blocks: buildArticleBlocks(content, config.lang, false),
  });

  console.log("Done! Check the teacher channel.");
  await app.stop();
  process.exit(0);
})();
