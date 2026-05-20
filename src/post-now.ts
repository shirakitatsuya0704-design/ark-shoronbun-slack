/**
 * 手動で今すぐ記事を投稿するためのスクリプト
 * npm run post:ja / npm run post:en で実行
 */
import { App } from "@slack/bolt";
import { config } from "./config";
import { postDailyContent } from "./scheduler";

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
});

(async () => {
  await app.start(config.slack.port);
  console.log(`Posting content now (lang=${config.lang})...`);
  await postDailyContent(app);
  await app.stop();
  process.exit(0);
})();
