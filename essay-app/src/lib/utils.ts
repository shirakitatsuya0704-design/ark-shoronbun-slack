import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EssayLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LEVEL_COLORS: Record<EssayLevel, string> = {
  初級: 'bg-green-100 text-green-800',
  中級: 'bg-blue-100 text-blue-800',
  上級: 'bg-purple-100 text-purple-800',
  超上級: 'bg-red-100 text-red-800',
};

export const ESSAY_LEVELS: EssayLevel[] = ['初級', '中級', '上級', '超上級'];

export const GRADES = [
  '中1', '中2', '中3',
  '高1', '高2', '高3',
  '高卒生', 'その他',
] as const;

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
