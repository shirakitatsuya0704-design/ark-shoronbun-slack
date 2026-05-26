import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'アークカレッジ 小論文添削ツール',
  description: '生徒の小論文をAIが個別最適化して添削する講師用ツール',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        {/* ヘッダー */}
        <header className="bg-blue-800 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="text-xl font-bold tracking-tight">ARK College</span>
              <span className="text-blue-200 text-sm">小論文添削ツール</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-blue-200 transition-colors">
                ダッシュボード
              </Link>
              <Link
                href="/students/new"
                className="bg-white text-blue-800 px-3 py-1.5 rounded-md font-semibold hover:bg-blue-50 transition-colors"
              >
                + 生徒登録
              </Link>
            </nav>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          {children}
        </main>

        {/* フッター */}
        <footer className="border-t bg-white text-center text-xs text-slate-400 py-4">
          © 2025 ARK College — 小論文添削・生徒状態管理ツール
        </footer>
      </body>
    </html>
  );
}
