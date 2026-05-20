import Anthropic from "@anthropic-ai/sdk";
import { config, Lang } from "../config";

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

export interface SourceArticle {
  title: string;
  url: string;
  summary: string;
}

export interface DailyContent {
  title: string;
  intro: string;
  sources: SourceArticle[];
  question: string;
  category: string;
}

// 曜日別テーマカテゴリ（0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土）
const weeklyCategories: Record<Lang, Record<number, { category: string; query: string }>> = {
  ja: {
    1: { category: "🏛 政治・国際", query: "日本の政治 国際関係 外交 最新ニュース 2025" },
    2: { category: "💰 経済・金融", query: "日本経済 円安 物価 金融政策 最新ニュース 2025" },
    3: { category: "🌍 社会・文化", query: "日本社会問題 少子化 多様性 文化 最新ニュース 2025" },
    4: { category: "🤖 テクノロジー", query: "AI テクノロジー デジタル社会 日本 最新ニュース 2025" },
    5: { category: "🌱 環境・科学", query: "気候変動 環境問題 科学技術 日本 最新ニュース 2025" },
    0: { category: "📚 自由テーマ", query: "日本 社会課題 最新トレンド 2025" },
    6: { category: "📚 自由テーマ", query: "日本 社会課題 最新トレンド 2025" },
  },
  en: {
    1: { category: "🏛 Politics & International", query: "global politics international relations latest news 2025" },
    2: { category: "💰 Economy & Finance", query: "global economy finance trade latest news 2025" },
    3: { category: "🌍 Society & Culture", query: "society culture diversity social issues latest news 2025" },
    4: { category: "🤖 Technology", query: "AI technology digital society latest news 2025" },
    5: { category: "🌱 Environment & Science", query: "climate change environment science latest news 2025" },
    0: { category: "📚 Free Theme", query: "global social issues trends 2025" },
    6: { category: "📚 Free Theme", query: "global social issues trends 2025" },
  },
};

function getTodayCategory(lang: Lang): { category: string; query: string } {
  const dow = new Date().getDay();
  return weeklyCategories[lang][dow];
}

const systemPrompts: Record<Lang, string> = {
  ja: `あなたは高校2年生向けの教育コンテンツを作成する専門家です。
web_searchツールを使って最新のニュース記事を検索し、実際のURLを取得してください。
日本語のニュースソース（NHK、朝日新聞、日経新聞、毎日新聞など）を優先してください。`,

  en: `You are an expert educational content creator for high school students.
Use the web_search tool to find real, current news articles with actual URLs.
Prefer reputable English sources (BBC, Reuters, The Guardian, AP News, etc.).`,
};

function buildUserPrompt(lang: Lang, query: string, category: string): string {
  if (lang === "ja") {
    return `テーマカテゴリ「${category}」について、検索クエリ「${query}」で最新のニュース記事を3本web_searchで検索してください。

検索後、以下の形式でJSONを返してください（コードブロックなし、純粋なJSONのみ）:
{
  "title": "今日のテーマタイトル（30文字以内）",
  "category": "${category}",
  "intro": "このテーマの導入文（150文字程度）。高校生が「なぜ今これが大事なのか」を感じられる書き方で。",
  "sources": [
    {
      "title": "記事タイトル",
      "url": "実際のURL（必ず検索で取得した本物のURLを使うこと）",
      "summary": "この記事の要点（80文字程度）"
    },
    { "title": "...", "url": "...", "summary": "..." },
    { "title": "...", "url": "...", "summary": "..." }
  ],
  "question": "3つの記事を踏まえた思考を深める問い（1文。「あなたはどう思う？」「なぜそうなのか？」「〜についてはどう考える？」形式）"
}`;
  }

  return `Search for 3 recent news articles about "${query}" (category: ${category}) using web_search.

Return ONLY valid JSON (no code blocks):
{
  "title": "Today's theme (under 60 characters)",
  "category": "${category}",
  "intro": "2-3 sentence intro explaining why this topic matters right now for students.",
  "sources": [
    { "title": "...", "url": "actual URL from search", "summary": "key point in 1-2 sentences" },
    { "title": "...", "url": "...", "summary": "..." },
    { "title": "...", "url": "...", "summary": "..." }
  ],
  "question": "One open-ended question that prompts deep thinking (e.g. 'What do you think about...?', 'Why do you believe...?')"
}`;
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const start = text.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return text;
}

export async function generateDailyContent(): Promise<DailyContent> {
  const { category, query } = getTodayCategory(config.lang);
  console.log(`[content] Category: "${category}", Query: "${query}"`);

  const tools = [{ type: "web_search_20250305", name: "web_search" } as unknown as Anthropic.Tool];
  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(config.lang, query, category) },
  ];

  let response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 4096,
    system: systemPrompts[config.lang],
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: toolUseBlocks.map((b) => ({
        type: "tool_result" as const,
        tool_use_id: b.id,
        content: JSON.stringify(b.input),
      })),
    });
    response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 4096,
      system: systemPrompts[config.lang],
      tools,
      messages,
    });
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");

  const parsed = JSON.parse(extractJson(textBlock.text.trim())) as DailyContent;
  console.log(`[content] Generated: "${parsed.title}" (${parsed.category})`);
  return parsed;
}
