'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LEVEL_COLORS, formatDate } from '@/lib/utils';
import type { Student } from '@/types';

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/students')
      .then((r) => r.json())
      .then((data) => setStudents(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">生徒ダッシュボード</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? '読み込み中...' : `${students.length}名の生徒が登録されています`}
          </p>
        </div>
        <Link href="/students/new">
          <Button>+ 新規生徒登録</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-lg">まだ生徒が登録されていません</p>
            <Link href="/students/new" className="mt-4 inline-block">
              <Button>最初の生徒を登録する</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`} className="block group">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-slate-200 group-hover:border-blue-300">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <Badge className={LEVEL_COLORS[student.current_level]}>
                      {student.current_level}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">{student.grade}</p>
                </CardHeader>
                <CardContent>
                  {student.profile_summary ? (
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {student.profile_summary}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      まだ添削履歴がありません
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-3">
                    登録日: {formatDate(student.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
