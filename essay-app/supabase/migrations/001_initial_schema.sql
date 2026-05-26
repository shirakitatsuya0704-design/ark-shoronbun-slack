-- ============================================================
-- アークカレッジ 小論文添削・生徒状態管理ツール
-- Supabase マイグレーション: 001_initial_schema
-- ============================================================

-- UUID拡張を有効化（Supabaseでは通常デフォルト有効）
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. students テーブル
-- ============================================================
create table if not exists public.students (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  grade           text not null,
  -- 学年: 中1 / 中2 / 中3 / 高1 / 高2 / 高3 / 高卒生 など
  current_level   text not null default '初級',
  -- レベル: 初級 / 中級 / 上級 / 超上級
  profile_summary text,
  -- AIが毎回更新する生徒の特性・弱点・思考の癖のサマリー
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- updated_at 自動更新トリガー関数
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger students_updated_at
  before update on public.students
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- 2. essay_histories テーブル
-- ============================================================
create table if not exists public.essay_histories (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid not null references public.students(id) on delete cascade,
  theme          text not null,
  -- 課題テーマ（例: 「人工知能と倫理」「少子化問題の解決策」）
  level          text not null,
  -- 初級 / 中級 / 上級 / 超上級
  submitted_text text not null,
  -- 生徒が書いた小論文本文
  ai_feedback    text,
  -- AIが生成した総合フィードバック
  strengths      text,
  -- AIが抽出した今回の強み（JSON文字列 or 改行区切りテキスト）
  weaknesses     text,
  -- AIが抽出した今回の弱点・改善点
  score          integer,
  -- 100点満点での参考スコア（AI算出）
  created_at     timestamptz not null default now()
);

-- student_id にインデックスを貼り、生徒ごとの履歴検索を高速化
create index if not exists essay_histories_student_id_idx
  on public.essay_histories(student_id);

-- 最新順取得用の複合インデックス
create index if not exists essay_histories_student_created_idx
  on public.essay_histories(student_id, created_at desc);

-- ============================================================
-- 3. RLS（Row Level Security）ポリシー
--    ※ 講師のみアクセスする社内ツールのため、まず全行アクセス許可で設定
--    　 本番運用時は Supabase Auth と連携して制限を追加すること
-- ============================================================
alter table public.students enable row level security;
alter table public.essay_histories enable row level security;

-- サービスロール（バックエンドAPI）からの全操作を許可
create policy "service_role_full_access_students"
  on public.students
  for all
  using (true)
  with check (true);

create policy "service_role_full_access_essays"
  on public.essay_histories
  for all
  using (true)
  with check (true);

-- ============================================================
-- 4. サンプルデータ（開発確認用・本番では不要）
-- ============================================================
insert into public.students (name, grade, current_level, profile_summary) values
  (
    '田中 太郎',
    '高2',
    '中級',
    '論理展開は安定しているが、具体例の選択が抽象的になりがち。社会問題への関心は高く、データを引用する姿勢は評価できる。一方、結論部分での「まとめすぎ」により議論の深みが失われることが多い。'
  ),
  (
    '佐藤 花子',
    '高3',
    '上級',
    '文章表現が豊かで感情に訴える力がある。ただし論理的な三段構成（序論・本論・結論）の意識が弱く、感情論に流れやすい傾向がある。哲学的テーマに強い関心を持つ。'
  ),
  (
    '鈴木 次郎',
    '中3',
    '初級',
    '文章量が少なく、主張の根拠が薄い段階。しかし独自の視点を持ち、発想力は高い。「なぜなら〜」という根拠提示の訓練が最優先課題。'
  )
on conflict do nothing;
