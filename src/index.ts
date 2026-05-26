import { App } from "@slack/bolt";
import cron from "node-cron";
import * as http from "http";
import { config } from "./config";
import { registerMentionHandler } from "./handlers/mention";
import { postDailyContent } from "./scheduler";

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
});

// メンションハンドラーを登録
registerMentionHandler(app);

// 毎日16:00（JST = UTC+9 → UTC 07:00）に配信
// TZ=Asia/Tokyo を設定して動作させる場合は "0 16 * * *" で良い
const cronSchedule = process.env.CRON_SCHEDULE ?? "0 16 * * *";

cron.schedule(
  cronSchedule,
  async () => {
    await postDailyContent(app).catch((err) => {
      console.error("Failed to post daily content:", err);
    });
  },
  {
    timezone: "Asia/Tokyo",
  }
);

// Render用ヘルスチェックサーバー
const port = config.slack.port;
http.createServer((_, res) => {
  res.writeHead(200);
  res.end("OK");
}).listen(port, () => {
  console.log(`🌐 Health check server listening on port ${port}`);
});

// Bolt アプリ起動
(async () => {
  await app.start();
  console.log(`⚡ Slack Bot started (lang=${config.lang})`);
  console.log(`📅 Daily content scheduled: ${cronSchedule} (Asia/Tokyo)`);

  // 起動直後にすぐ配信テストしたい場合は以下をコメント解除
  // await postDailyContent(app);
})();
