'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { Project } from '../data';
import { projects } from '../data';
import { loadUserProjects, upsertUserProject } from '../storage';
import { upsertProject } from '../supabaseRepo';
import RoomGate from '../RoomGate';

const MAX_IMAGE_BYTES = 2_500_000; // 2.5MB (dataURL은 더 커짐) - 너무 큰 파일은 브라우저 저장에 부담

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽을 수 없어요.'));
    reader.readAsDataURL(file);
  });
}

function ProjectDetailPageInner({ roomCode }: { roomCode: string }) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Project | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setUserProjects(loadUserProjects());
  }, []);

  const project = useMemo(() => {
    if (!slug) return null;
    return (
      userProjects.find((p) => p.slug === slug) ??
      projects.find((p) => p.slug === slug) ??
      null
    );
  }, [slug, userProjects]);

  useEffect(() => {
    // 편집 시작 시 현재 프로젝트를 draft로 복사
    if (!project) {
      setDraft(null);
      setIsEditing(false);
      return;
    }
    setDraft(project);
  }, [project]);

  const saveDraft = async () => {
    if (!draft) return;
    upsertUserProject(draft); // 기본 프로젝트도 override로 저장됨
    
    // Supabase 동기화
    try {
      await upsertProject(roomCode, draft);
    } catch (e) {
      console.error('Supabase 동기화 실패:', e);
      // LocalStorage에는 저장되었으므로 계속 진행
    }
    
    setUserProjects(loadUserProjects());
    setIsEditing(false);
  };

  const onUploadHeroImage = async (files: FileList | null) => {
    if (!files || !draft || files.length === 0) return;
    setErrorMsg(null);

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일만 업로드할 수 있어요.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMsg(
        `이미지 "${file.name}"가 너무 커요. (최대 ${(MAX_IMAGE_BYTES / 1_000_000).toFixed(
          1
        )}MB) 조금 더 작은 파일로 올려주세요.`
      );
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setDraft({ ...draft, heroImage: dataUrl });
    } catch {
      setErrorMsg('업로드 중 문제가 생겼어요. 다시 시도해 주세요.');
    }
  };

  const onUploadPhotos = async (files: FileList | null) => {
    if (!files || !draft) return;
    setErrorMsg(null);

    try {
      const nextMemories = [...draft.memories];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > MAX_IMAGE_BYTES) {
          setErrorMsg(
            `이미지 "${file.name}"가 너무 커요. (최대 ${(MAX_IMAGE_BYTES / 1_000_000).toFixed(
              1
            )}MB) 조금 더 작은 파일로 올려주세요.`
          );
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        nextMemories.unshift({
          src: dataUrl,
          alt: file.name,
          caption: '새로운 추억',
          date: new Date().toISOString().slice(0, 10),
        });
      }
      setDraft({ ...draft, memories: nextMemories });
    } catch {
      setErrorMsg('업로드 중 문제가 생겼어요. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50">
      <header className="container mx-auto px-4 pt-10 pb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span aria-hidden>←</span>
            메인으로
          </Link>

          {project ? (
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-full bg-white/70 backdrop-blur px-4 py-2 text-sm font-semibold text-gray-800 ring-1 ring-black/5 hover:bg-white"
                >
                  편집
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(project);
                      setIsEditing(false);
                      setErrorMsg(null);
                    }}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                  >
                    저장
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {!project ? (
            <div className="rounded-2xl bg-white/85 backdrop-blur ring-1 ring-black/5 shadow-xl p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                페이지를 찾을 수 없어요
              </h1>
              <p className="mt-3 text-gray-700">
                아직 만들어지지 않은 추억일 수 있어요. 메인에서 “새 추억 추가하기”로 만들어 주세요.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/projects/new"
                  className="rounded-full bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-600"
                >
                  새 추억 추가
                </Link>
                <Link
                  href="/"
                  className="rounded-full px-5 py-3 font-semibold text-gray-700 hover:text-gray-900"
                >
                  메인으로
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="rounded-2xl border border-black/5 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  {isEditing && draft ? (
                    <>
                      {draft.heroImage ? (
                        <Image
                          src={draft.heroImage}
                          alt={draft.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 896px"
                        />
                      ) : (
                        <div className={`h-full w-full ${draft.heroGradientClassName}`} />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <label className="cursor-pointer rounded-full bg-white/90 backdrop-blur px-6 py-3 font-semibold text-gray-900 shadow-lg hover:bg-white transition-colors">
                          {draft.heroImage ? '대표 이미지 변경' : '대표 이미지 업로드'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onUploadHeroImage(e.target.files)}
                          />
                        </label>
                      </div>
                    </>
                  ) : project.heroImage ? (
                    <Image
                      src={project.heroImage}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 896px"
                    />
                  ) : (
                    <div className={`h-full w-full ${project.heroGradientClassName}`} />
                  )}
                </div>
                <div className="p-8 md:p-10">
                  {!isEditing || !draft ? (
                    <>
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        {project.title}
                      </h1>
                      <p className="mt-4 text-gray-700 leading-relaxed">
                        {project.summary}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <label className="block">
                        <div className="text-sm font-semibold text-gray-700">제목</div>
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </label>
                      <label className="block">
                        <div className="text-sm font-semibold text-gray-700">요약</div>
                        <textarea
                          value={draft.summary}
                          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                          className="mt-1 w-full min-h-24 rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </label>
                      <label className="block">
                        <div className="text-sm font-semibold text-gray-700">태그(콤마)</div>
                        <input
                          value={draft.tags.join(', ')}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              tags: e.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </label>
                      <label className="block">
                        <div className="text-sm font-semibold text-gray-700">이벤트 문구</div>
                        <textarea
                          value={draft.loveNote ?? ''}
                          onChange={(e) =>
                            setDraft({ ...draft, loveNote: e.target.value || undefined })
                          }
                          className="mt-1 w-full min-h-20 rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </label>
                      <label className="block">
                        <div className="text-sm font-semibold text-gray-700">스토리(선택)</div>
                        <textarea
                          value={draft.story ?? ''}
                          onChange={(e) =>
                            setDraft({ ...draft, story: e.target.value || undefined })
                          }
                          className="mt-1 w-full min-h-28 rounded-xl border border-black/10 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm bg-rose-50 text-rose-800 ring-1 ring-rose-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {(isEditing ? draft?.loveNote : project.loveNote) ? (
                <section>
                  <div className="rounded-2xl border border-black/5 bg-white/85 backdrop-blur shadow-sm p-6 md:p-7">
                    <p className="text-sm uppercase tracking-widest text-gray-500">
                      For us
                    </p>
                    <p className="mt-2 text-lg md:text-xl font-medium text-gray-900 leading-relaxed">
                      {isEditing ? draft?.loveNote : project.loveNote}
                    </p>
                  </div>
                </section>
              ) : null}

              {(isEditing ? draft?.story : project.story) ? (
                <section>
                  <div className="rounded-2xl border border-black/5 bg-white/85 backdrop-blur shadow-sm p-6 md:p-7">
                    <p className="text-sm uppercase tracking-widest text-gray-500">
                      Story
                    </p>
                    <p className="mt-2 text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {isEditing ? draft?.story : project.story}
                    </p>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">
                    추억 사진
                  </h2>
                  {isEditing && draft ? (
                    <label className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 cursor-pointer">
                      <span aria-hidden>＋</span> 사진 업로드
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onUploadPhotos(e.target.files)}
                      />
                    </label>
                  ) : null}
                </div>

                {errorMsg ? (
                  <div className="mb-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100 px-4 py-3">
                    {errorMsg}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(isEditing ? draft?.memories : project.memories)?.map((img, idx) => (
                    <div
                      key={`${img.src}-${idx}`}
                      className="rounded-xl bg-white/90 border border-black/5 shadow-sm overflow-hidden"
                    >
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          className="object-cover"
                          priority={idx === 0}
                        />
                      </div>
                      <div className="p-4">
                        {!isEditing || !draft ? (
                          <>
                            {img.caption && (
                              <p className="font-medium text-gray-900">
                                {img.caption}
                              </p>
                            )}
                            {img.date && (
                              <p className="mt-1 text-sm text-gray-600">
                                {img.date}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-700">
                                사진 정보
                              </div>
                              <button
                                type="button"
                                className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                                onClick={() => {
                                  const next = draft.memories.filter((_, i) => i !== idx);
                                  setDraft({ ...draft, memories: next });
                                }}
                              >
                                삭제
                              </button>
                            </div>
                            <label className="block">
                              <div className="text-xs font-semibold text-gray-600">캡션</div>
                              <input
                                value={img.caption ?? ''}
                                onChange={(e) => {
                                  const next = [...draft.memories];
                                  next[idx] = { ...next[idx], caption: e.target.value || undefined };
                                  setDraft({ ...draft, memories: next });
                                }}
                                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                              />
                            </label>
                            <label className="block">
                              <div className="text-xs font-semibold text-gray-600">날짜</div>
                              <input
                                value={img.date ?? ''}
                                onChange={(e) => {
                                  const next = [...draft.memories];
                                  next[idx] = { ...next[idx], date: e.target.value || undefined };
                                  setDraft({ ...draft, memories: next });
                                }}
                                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <RoomGate>{(roomCode) => <ProjectDetailPageInner roomCode={roomCode} />}</RoomGate>;
}

