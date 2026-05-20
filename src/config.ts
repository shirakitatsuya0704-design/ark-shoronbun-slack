import * as dotenv from "dotenv";
import * as path from "path";

const lang = process.env.APP_LANG ?? "ja";
const envFile = path.resolve(process.cwd(), `.env.${lang}`);
dotenv.config({ path: envFile });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export type Lang = "ja" | "en";

export const config = {
  lang: lang as Lang,

  slack: {
    botToken: requireEnv("SLACK_BOT_TOKEN"),
    signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
    appToken: requireEnv("SLACK_APP_TOKEN"),

    // 先生用チャンネル（AIとFBを作る場所）
    teacherChannelId: requireEnv("TEACHER_CHANNEL_ID"),

    // 生徒チャンネル（カンマ区切りで複数指定可）
    // 例: C0123456789,C9876543210
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
