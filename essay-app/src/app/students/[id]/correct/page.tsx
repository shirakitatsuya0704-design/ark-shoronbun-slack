'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ESSAY_LEVELS, LEVEL_COLORS } from '@/lib/utils';
import type { Student, CorrectionResult } from '@/types';

export default function CorrectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then(setStudent);
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const form = e.currentTarget;
    const data = {
      student_id: id,
      theme: (form.elements.namedItem('theme') as HTMLInputElement).value,
      level: (form.elements.namedItem('level') as HTMLSelectElement).value,
      submitted_text: (form.elements.namedItem('submitted_text') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/api/essays/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '添削に失敗しました');
      }
      const correctionResult = await res.json();
      setResult(correctionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添削に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ナビゲーション */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">ダッシュボード</Link>
        <span>/</span>
        {student && (
          <>
            <Link href={`/students/${id}`} className="hover:text-blue-600">{student.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-700">添削実行</span>
      </div>

      {/* 生徒情報バナー */}
      {student && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {student.name.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-slate-800">{student.name}</span>
            <span className="text-slate-500 text-sm ml-2">{student.grade}</span>
          </div>
          <Badge className={LEVEL_COLORS[student.current_level]}>
            {student.current_level}
          </Badge>
        </div>
      )}

      {/* 入力フォーム */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>小論文添削フォーム</CardTitle>
            <CardDescription>
              課題テーマとレベル、生徒の解答を入力してください。過去の履歴を踏まえたAI添削を実行します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="theme">課題テーマ *</Label>
                <Input
                  id="theme"
                  name="theme"
                  placeholder="例: 人工知能と人間社会の共存について"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="level">難易度レベル *</Label>
                <Select
                  id="level"
                  name="level"
                  defaultValue={student?.current_level ?? ''}
                  required
                >
                  <option value="">選択してください</option>
                  {ESSAY_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submitted_text">生徒の解答 *</Label>
                <Textarea
                  id="submitted_text"
                  name="submitted_text"
                  placeholder="生徒が書いた小論文をここに貼り付けてください..."
                  className="min-h-[240px]"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} size="lg" className="flex-1">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      AI添削中...（30秒ほどかかります）
                    </span>
                  ) : (
                    'AI添削を実行する'
                  )}
                </Button>
                <Link href={`/students/${id}`}>
                  <Button type="button" variant="outline" size="lg">戻る</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 添削結果 */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">添削結果</h2>
            <span className="text-2xl font-bold text-blue-700">{result.score}点</span>
          </div>

          {/* 強み */}
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700">強み・評価できる点</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.strengths}
              </p>
            </CardContent>
          </Card>

          {/* 弱点 */}
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-700">課題・改善が必要な点</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.weaknesses}
              </p>
            </CardContent>
          </Card>

          {/* 総合フィードバック */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-700">総合フィードバック</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.feedback}
              </p>
            </CardContent>
          </Card>

          {/* 更新されたプロファイル */}
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700">更新された生徒プロファイル</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.updated_profile_summary}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href={`/students/${id}`} className="flex-1">
              <Button className="w-full">生徒詳細に戻る</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setResult(null)}
            >
              別の添削を行う
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
