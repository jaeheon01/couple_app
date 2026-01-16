'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';

import type { Project } from './data';
import { getSupabaseClient } from '@/lib/supabaseClient';

export type RoomCode = string;

export type DbProject = {
  id: string;
  room_code: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  hero_gradient_class_name: string;
  hero_image: string | null;
  love_note: string | null;
  story: string | null;
  created_at: string;
  updated_at: string;
};

export type DbMemory = {
  id: string;
  project_id: string;
  image_url: string;
  caption: string | null;
  memory_date: string | null;
  sort_order: number;
  created_at: string;
};

export function dbProjectToUi(p: DbProject, memories: DbMemory[]): Project {
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    tags: p.tags ?? [],
    heroGradientClassName: p.hero_gradient_class_name,
    heroImage: p.hero_image ?? undefined,
    loveNote: p.love_note ?? undefined,
    story: p.story ?? undefined,
    memories: memories
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((m) => ({
        src: m.image_url,
        alt: m.caption ?? '추억',
        caption: m.caption ?? undefined,
        date: m.memory_date ?? undefined,
      })),
  };
}

export async function ensureRoom(code: RoomCode) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았어요.');

  // upsert rooms - 타입 에러 방지를 위해 any 사용
  await (supabase.from('rooms') as any)
    .upsert({ code }, { onConflict: 'code' })
    .select('code')
    .single();
}

export async function listProjects(roomCode: RoomCode) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았어요.');

  const { data: ps, error: e1 } = await (supabase.from('projects') as any)
    .select('*')
    .eq('room_code', roomCode)
    .order('updated_at', { ascending: false });
  if (e1) {
    console.error('❌ projects 조회 실패:', e1);
    throw e1;
  }

  const projects = (ps as DbProject[]) ?? [];
  if (!projects.length) {
    console.log('📭 Supabase에 프로젝트가 없어요');
    return [];
  }

  const ids = projects.map((p) => p.id);
  const { data: ms, error: e2 } = await (supabase.from('memories') as any)
    .select('*')
    .in('project_id', ids);
  if (e2) {
    console.error('❌ memories 조회 실패:', e2);
    throw e2;
  }

  const memories = (ms as DbMemory[]) ?? [];
  const byProject = new Map<string, DbMemory[]>();
  for (const m of memories) {
    const arr = byProject.get(m.project_id) ?? [];
    arr.push(m);
    byProject.set(m.project_id, arr);
  }

  const result = projects.map((p) => dbProjectToUi(p, byProject.get(p.id) ?? []));
  console.log(`✅ ${result.length}개 프로젝트, 총 ${memories.length}개 사진 로드됨`);
  return result;
}

export async function upsertProject(roomCode: RoomCode, project: Project) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았어요.');

  console.log(`💾 프로젝트 저장 시작: ${project.slug}, 사진 ${project.memories.length}개`);

  const existingResult = await (supabase.from('projects') as any)
    .select('*')
    .eq('room_code', roomCode)
    .eq('slug', project.slug)
    .maybeSingle();
  if (existingResult.error) {
    console.error('❌ 기존 프로젝트 조회 실패:', existingResult.error);
    throw existingResult.error;
  }
  const existing = existingResult.data as DbProject | null;

  const payload = {
    room_code: roomCode,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    tags: project.tags,
    hero_gradient_class_name: project.heroGradientClassName,
    hero_image: project.heroImage ?? null,
    love_note: project.loveNote ?? null,
    story: project.story ?? null,
  };

  console.log('📤 projects 테이블에 저장 시도:', payload);
  const result = await (supabase.from('projects') as any)
    .upsert(payload, { onConflict: 'room_code,slug' })
    .select('*')
    .single();
  if (result.error) {
    console.error('❌ projects upsert 실패:', result.error);
    console.error('상세 에러:', JSON.stringify(result.error, null, 2));
    throw new Error(`프로젝트 저장 실패: ${result.error.message || JSON.stringify(result.error)}`);
  }

  const saved = result.data as DbProject;
  if (!saved || !saved.id) {
    console.error('❌ projects 저장 후 데이터 없음:', result);
    throw new Error('프로젝트 저장 후 ID를 받지 못했어요.');
  }
  const projectId = saved.id;
  console.log('✅ 프로젝트 저장 완료, ID:', projectId, 'room_code:', saved.room_code);

  // memories는 단순화를 위해 "전체 교체" 방식 (동시 편집 충돌은 last-write-wins)
  if (existing?.id) {
    await supabase.from('memories').delete().eq('project_id', projectId);
  }

  const memRows = project.memories.map((m, idx) => ({
    project_id: projectId,
    image_url: m.src,
    caption: m.caption ?? null,
    memory_date: m.date ?? null,
    sort_order: idx,
  }));

  if (memRows.length) {
    console.log(`💾 ${memRows.length}개 사진 저장 중...`);
    console.log('📤 memories 테이블에 저장 시도 (첫 번째 사진 샘플):', {
      project_id: memRows[0]?.project_id,
      image_url_length: memRows[0]?.image_url?.length,
      is_dataURL: memRows[0]?.image_url?.startsWith('data:'),
    });
    const { error: e2, data: insertedMemories } = await (supabase.from('memories') as any).insert(memRows).select('*');
    if (e2) {
      console.error('❌ 사진 저장 실패:', e2);
      console.error('상세 에러:', JSON.stringify(e2, null, 2));
      throw new Error(`사진 저장 실패: ${e2.message || JSON.stringify(e2)}`);
    }
    console.log('✅ 사진 저장 완료, 저장된 개수:', insertedMemories?.length || memRows.length);
  }

  return projectId;
}

export async function uploadMemoryImage(roomCode: RoomCode, file: File) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았어요.');

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const path = `${roomCode}/${fileName}`;

  const { error } = await supabase.storage.from('memories').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('memories').getPublicUrl(path);
  return data.publicUrl;
}

export function subscribeRoom(roomCode: RoomCode, onChange: () => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  let channel: RealtimeChannel | null = null;

  channel = supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects', filter: `room_code=eq.${roomCode}` },
      () => onChange()
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, () => onChange())
    .subscribe();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

