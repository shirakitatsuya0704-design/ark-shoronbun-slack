'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ESSAY_LEVELS, GRADES } from '@/lib/utils';

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      grade: (form.elements.namedItem('grade') as HTMLSelectElement).value,
      current_level: (form.elements.namedItem('current_level') as HTMLSelectElement).value,
    };

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('登録に失敗しました');
      const student = await res.json();
      router.push(`/students/${student.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← ダッシュボードに戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規生徒登録</CardTitle>
          <CardDescription>生徒の基本情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">氏名 *</Label>
              <Input
                id="name"
                name="name"
                placeholder="例: 田中 太郎"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grade">学年 *</Label>
              <Select id="grade" name="grade" required>
                <option value="">選択してください</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="current_level">現在の小論文レベル *</Label>
              <Select id="current_level" name="current_level" required>
                <option value="">選択してください</option>
                {ESSAY_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '登録中...' : '登録する'}
              </Button>
              <Link href="/">
                <Button type="button" variant="outline">キャンセル</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
