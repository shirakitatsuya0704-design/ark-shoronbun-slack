import * as fs from "fs";
import * as path from "path";

// ローカル開発時のみ .env.ja / .env.en を読み込む
// Railway等のクラウドでは process.env に直接注入されるので不要
const lang = process.env.APP_LANG ?? "ja";
const envFile = path.resolve(process.cwd(), `.env.${lang}`);

if (fs.existsSync(envFile)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config({ path: envFile });
}

export type Lang = "ja" | "en";

export const config = {
  lang: lang as Lang,

  slack: {
    botToken: requireEnv("SLACK_BOT_TOKEN"),
    signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
    appToken: requireEnv("SLACK_APP_TOKEN"),
    teacherChannelId: requireEnv("TEACHER_CHANNEL_ID"),
    studentChannelIds: (process.env.STUDENT_CHANNEL_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    port: parseInt(process.env.PORT ?? "3000", 10),
  },

  anthropic: {
    apiKey: requireEnv("ANTHROPIC_API_KEY"),
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  },
};

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}
