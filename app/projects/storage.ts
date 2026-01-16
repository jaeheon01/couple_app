'use client';

import type { Project } from './data';

const STORAGE_KEY = 'jaeheon-portfolio-projects-v1';

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadUserProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeJsonParse<Project[]>(window.localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((p) => !!p && typeof p.slug === 'string' && p.slug.length > 0);
}

export function saveUserProjects(projects: Project[]) {
  if (typeof window === 'undefined') return;
  
  // dataURL을 제거한 경량 버전으로 저장 (LocalStorage 용량 절약)
  const lightweight = projects.map(p => ({
    ...p,
    memories: p.memories.map(m => ({
      ...m,
      src: m.src.startsWith('data:') ? '' : m.src, // dataURL은 제외
    })),
    heroImage: p.heroImage?.startsWith('data:') ? undefined : p.heroImage,
  }));
  
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError') {
      console.error('❌ LocalStorage 용량 초과 - 데이터를 저장할 수 없어요.');
      // 기존 데이터를 삭제하고 다시 시도
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
        console.log('✅ 기존 데이터 삭제 후 저장 성공');
      } catch (e2) {
        console.error('❌ LocalStorage 저장 실패:', e2);
        throw e2;
      }
    } else {
      throw e;
    }
  }
}

export function upsertUserProject(project: Project) {
  const existing = loadUserProjects();
  const idx = existing.findIndex((p) => p.slug === project.slug);
  const next = [...existing];
  if (idx >= 0) next[idx] = project;
  else next.unshift(project);
  saveUserProjects(next);
}

export function getUserProjectBySlug(slug: string) {
  return loadUserProjects().find((p) => p.slug === slug) ?? null;
}

export function deleteUserProject(slug: string) {
  const existing = loadUserProjects();
  saveUserProjects(existing.filter((p) => p.slug !== slug));
}

export function slugifyKo(input: string) {
  // 간단 슬러그(영문/숫자/-). 한글은 제거되므로 사용자가 직접 슬러그를 다듬을 수 있게 합니다.
  const base = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `memory-${Date.now()}`;
}

