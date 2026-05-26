'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LEVEL_COLORS, formatDate } from '@/lib/utils';
import type { Student, EssayHistory } from '@/types';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [histories, setHistories] = useState<EssayHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/students/${id}`).then((r) => r.json()),
      fetch(`/api/essays?student_id=${id}`).then((r) => r.json()),
    ])
      .then(([s, h]) => {
        setStudent(s);
        setHistories(h);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-60 bg-slate-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">生徒が見つかりません</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          ダッシュボードに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* パンくずリスト */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← ダッシュボードに戻る
        </Link>
        <Link href={`/students/${id}/correct`}>
          <Button>添削を実行する</Button>
        </Link>
      </div>

      {/* 生徒基本情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{student.name}</CardTitle>
                <Badge className={LEVEL_COLORS[student.current_level]}>
                  {student.current_level}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{student.grade} · 登録日: {formatDate(student.created_at)}</p>
            </div>
          </div>
        </CardHeader>
        {student.profile_summary && (
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                AI 生徒プロファイル（最新）
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {student.profile_summary}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 添削履歴 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          添削履歴 ({histories.length}件)
        </h2>

        {histories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">まだ添削履歴がありません</p>
              <Link href={`/students/${id}/correct`} className="mt-4 inline-block">
                <Button>最初の添削を実行する</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {histories.map((h) => (
              <Card key={h.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{h.theme}</CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(h.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={LEVEL_COLORS[h.level]}>{h.level}</Badge>
                      {h.score != null && (
                        <span className="text-sm font-bold text-slate-700">{h.score}点</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 強み・弱点 */}
                  {(h.strengths || h.weaknesses) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {h.strengths && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">強み</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{h.strengths}</p>
                        </div>
                      )}
                      {h.weaknesses && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-red-700 mb-1">課題・弱点</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{h.weaknesses}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AIフィードバック全文（折りたたみ） */}
                  {h.ai_feedback && (
                    <details className="group">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:underline select-none">
                        AIフィードバック全文を見る
                      </summary>
                      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {h.ai_feedback}
                        </p>
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
