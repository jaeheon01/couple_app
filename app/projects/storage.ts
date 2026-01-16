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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
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

