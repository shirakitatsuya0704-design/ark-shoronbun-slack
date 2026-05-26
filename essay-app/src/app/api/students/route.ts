import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent } from '@/lib/supabase';

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json(students);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const student = await createStudent({
      name: body.name,
      grade: body.grade,
      current_level: body.current_level,
    });
    return NextResponse.json(student, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
