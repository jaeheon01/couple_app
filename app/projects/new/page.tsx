'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { Project } from '../data';
import { slugifyKo, upsertUserProject } from '../storage';

type Memory = Project['memories'][number];

const gradients = [
  'bg-gradient-to-br from-rose-300 to-pink-400',
  'bg-gradient-to-br from-pink-300 to-violet-400',
  'bg-gradient-to-br from-violet-300 to-fuchsia-400',
  'bg-gradient-to-br from-amber-300 to-rose-400',
];

export default function NewProjectPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('연인, 추억');
  const [loveNote, setLoveNote] = useState('너와 함께한 순간들을 오래오래 간직하고 싶어.');
  const [heroGradientClassName, setHeroGradientClassName] = useState(gradients[0]);
  const [memories, setMemories] = useState<Memory[]>([
    { src: '/projects/new-memory/01.jpg', alt: '추억 1', caption: '우리의 첫 사진', date: '' },
  ]);

  const computedSlug = useMemo(() => {
    if (slug.trim()) return slug.trim();
    return slugifyKo(title);
  }, [slug, title]);

  const onAddMemory = () => {
    setMemories((prev) => [
      ...prev,
      {
        src: `/projects/${computedSlug}/0${Math.min(prev.length + 1, 9)}.jpg`,
        alt: `추억 ${prev.length + 1}`,
        caption: '',
        date: '',
      },
    ]);
  };

  const onRemoveMemory = (idx: number) => {
    setMemories((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSave = () => {
    const safeTitle = title.trim() || '새 추억';
    const safeSlug = computedSlug;
    const safeMemories = memories
      .map((m, i) => ({
        ...m,
        src: (m.src || '').trim(),
        alt: (m.alt || `추억 ${i + 1}`).trim(),
        caption: (m.caption || '').trim() || undefined,
        date: (m.date || '').trim() || undefined,
      }))
      .filter((m) => m.src.length > 0);

    const project: Project = {
      slug: safeSlug,
      title: safeTitle,
      summary: summary.trim() || '우리의 소중한 추억을 모아둔 페이지',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      heroGradientClassName,
      loveNote: loveNote.trim() || undefined,
      memories: safeMemories.length ? safeMemories : [{ src: '/projects/placeholder.jpg', alt: '추억' }],
    };

    upsertUserProject(project);
    window.location.href = `/projects/${project.slug}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50">
      <header className="container mx-auto px-4 pt-10 pb-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span aria-hidden>←</span> 메인으로
          </Link>
          <div className="text-sm text-gray-600">새 추억 추가</div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-2xl bg-white/85 backdrop-blur ring-1 ring-black/5 shadow-xl overflow-hidden">
            <div className={`h-32 ${heroGradientClassName}`} />
            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">제목</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="예) 우리가 함께한 2026"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">슬러그(URL)</div>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder={`자동: ${computedSlug}`}
                  />
                  <div className="text-xs text-gray-500">
                    저장 후 주소: <span className="font-mono">/projects/{computedSlug}</span>
                  </div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">한 줄 이벤트 문구</div>
                  <textarea
                    value={loveNote}
                    onChange={(e) => setLoveNote(e.target.value)}
                    className="w-full min-h-24 rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="예) 오늘도 너랑 함께라서 행복해."
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">요약</div>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full min-h-20 rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="프로젝트 카드에 보여줄 짧은 설명"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">태그(콤마로 구분)</div>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="예) 여행, 데이트, 기념일"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">대표 그라데이션</div>
                  <div className="flex flex-wrap gap-3">
                    {gradients.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setHeroGradientClassName(g)}
                        className={`h-12 w-24 rounded-xl ring-2 ${
                          heroGradientClassName === g ? 'ring-pink-400' : 'ring-black/10'
                        } ${g}`}
                        aria-label="그라데이션 선택"
                      />
                    ))}
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">추억 사진</h2>
                  <button
                    type="button"
                    onClick={onAddMemory}
                    className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-white font-semibold hover:bg-pink-600"
                  >
                    <span aria-hidden>＋</span> 사진 추가
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {memories.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-black/5 bg-white p-4 md:p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="font-semibold text-gray-900">사진 {idx + 1}</div>
                        <button
                          type="button"
                          onClick={() => onRemoveMemory(idx)}
                          className="text-sm text-rose-600 hover:text-rose-700"
                        >
                          삭제
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <label className="space-y-1">
                          <div className="text-sm font-medium text-gray-700">이미지 경로/URL</div>
                          <input
                            value={m.src}
                            onChange={(e) =>
                              setMemories((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, src: e.target.value } : x))
                              )
                            }
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder={`/projects/${computedSlug}/01.jpg 또는 https://...`}
                          />
                        </label>

                        <label className="space-y-1">
                          <div className="text-sm font-medium text-gray-700">캡션(선택)</div>
                          <input
                            value={m.caption ?? ''}
                            onChange={(e) =>
                              setMemories((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, caption: e.target.value } : x
                                )
                              )
                            }
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="예) 이 날 너 진짜 예뻤어"
                          />
                        </label>

                        <label className="space-y-1">
                          <div className="text-sm font-medium text-gray-700">날짜(선택)</div>
                          <input
                            value={m.date ?? ''}
                            onChange={(e) =>
                              setMemories((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, date: e.target.value } : x))
                              )
                            }
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="예) 2026-01-15"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <Link
                    href="/"
                    className="rounded-full px-5 py-3 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    취소
                  </Link>
                  <button
                    type="button"
                    onClick={onSave}
                    className="rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
                  >
                    저장하고 열기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            사진 파일은 <span className="font-mono">public/projects/{computedSlug}/</span> 아래에
            넣고, 경로를 <span className="font-mono">/projects/{computedSlug}/01.jpg</span>처럼
            입력하면 됩니다.
          </div>
        </div>
      </main>
    </div>
  );
}

