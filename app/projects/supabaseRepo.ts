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

  // upsert rooms
  await supabase
    .from('rooms')
    .upsert({ code } as { code: string }, { onConflict: 'code' })
    .select('code')
    .single();
}

export async function listProjects(roomCode: RoomCode) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았어요.');

  const { data: ps, error: e1 } = await supabase
    .from('projects')
    .select('*')
    .eq('room_code', roomCode)
    .order('updated_at', { ascending: false });
  if (e1) throw e1;

  const projects = ps as DbProject[];
  if (!projects.length) return [];

  const ids = projects.map((p) => p.id);
  const { data: ms, error: e2 } = await supabase
    .from('memories')
    .select('*')
    .in('project_id', ids);
  if (e2) throw e2;

  const memories = (ms as DbMemory[]) ?? [];
  const byProject = new Map<string, DbMemory[]>();
  for (const m of memories) {
    const arr = byProject.get(m.project_id) ?? [];
    arr.push(m);
    byProject.set(m.project_id, arr);
  }

  return projects.map((p) => dbProjectToUi(p, byProject.get(p.id) ?? []));
}

export async function upsertProject(roomCode: RoomCode, project: Project) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았어요.');

  const { data: existing, error: e0 } = await supabase
    .from('projects')
    .select('*')
    .eq('room_code', roomCode)
    .eq('slug', project.slug)
    .maybeSingle();
  if (e0) throw e0;

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

  const { data: saved, error: e1 } = await supabase
    .from('projects')
    .upsert(payload, { onConflict: 'room_code,slug' })
    .select('*')
    .single();
  if (e1) throw e1;

  const projectId = (saved as DbProject).id;

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
    const { error: e2 } = await supabase.from('memories').insert(memRows);
    if (e2) throw e2;
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

