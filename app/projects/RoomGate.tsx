'use client';

import { useEffect, useState } from 'react';

import { ensureRoom } from './supabaseRepo';
import { getRoomCode, setRoomCode } from './room';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function RoomGate({
  children,
}: {
  children: (roomCode: string) => React.ReactNode;
}) {
  const [roomCode, setRoomCodeState] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRoomCodeState(getRoomCode());
  }, []);

  const submit = async () => {
    setError(null);
    const code = input.trim();
    if (!code) return setError('커플 코드를 입력해 주세요.');

    // Supabase 설정 안 된 상태면 안내
    if (!getSupabaseClient()) {
      const missing: string[] = [];
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return setError(
        `Supabase 환경변수가 아직 설정되지 않았어요. (${missing.join(', ') || '값 확인 필요'})`
      );
    }

    try {
      await ensureRoom(code);
      setRoomCode(code); // LocalStorage에 저장
      setRoomCodeState(code);
    } catch (e) {
      console.error('룸 생성/조회 실패:', e);
      setError('룸을 만들거나 불러오는 데 실패했어요. 설정을 확인해 주세요.');
    }
  };

  if (roomCode) return <>{children(roomCode)}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto rounded-2xl bg-white/85 backdrop-blur ring-1 ring-black/5 shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900">커플 코드 입력</h1>
          <p className="mt-2 text-gray-700">
            둘이 같은 코드를 입력하면 같은 앨범을 보면서 동시에 편집/동기화돼요.
          </p>

          <div className="mt-6 space-y-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="예) jaeheon-eunji-2026"
            />
            {error ? (
              <div className="rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100 px-4 py-3">
                {error}
              </div>
            ) : null}
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
            >
              시작하기
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-600">
            Supabase 설정은 `app/projects/sync.md`를 참고해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

