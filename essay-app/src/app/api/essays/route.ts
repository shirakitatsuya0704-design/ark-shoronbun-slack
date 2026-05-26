import { NextRequest, NextResponse } from 'next/server';
import { getEssayHistories } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('student_id');
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    const histories = await getEssayHistories(studentId);
    return NextResponse.json(histories);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
