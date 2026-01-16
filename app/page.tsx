'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import FadeInSection from './components/FadeInSection';
import PetalFall from './components/PetalFall';
import { projects } from './projects/data';
import type { Project } from './projects/data';
import { loadUserProjects } from './projects/storage';
import RoomGate from './projects/RoomGate';
import { listProjects, subscribeRoom } from './projects/supabaseRepo';

type CoupleMessages = {
  jaeheon: string;
  eunji: string;
};

const COUPLE_MESSAGES_KEY = 'jaeheon-portfolio-couple-messages-v1';

function loadCoupleMessages(): CoupleMessages {
  if (typeof window === 'undefined')
    return {
      jaeheon: '은지야 우리 세상에서 가장 예쁜 커플이 되자! 힘들고 지치는 상황에서도 서로 힘을 나누고 함께 행복하게 지내자. 사랑해❤️',
      eunji: '연인에게 하고 싶은 말을 작성해주세요.',
    };
  try {
    const stored = window.localStorage.getItem(COUPLE_MESSAGES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.jaeheon && parsed.eunji) return parsed;
    }
  } catch {}
  return {
    jaeheon: '은지야 우리 세상에서 가장 예쁜 커플이 되자! 힘들고 지치는 상황에서도 서로 힘을 나누고 함께 행복하게 지내자. 사랑해❤️',
    eunji: '연인에게 하고 싶은 말을 작성해주세요.',
  };
}

function saveCoupleMessages(messages: CoupleMessages) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COUPLE_MESSAGES_KEY, JSON.stringify(messages));
}

function HomeInner({ roomCode }: { roomCode: string }) {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [remoteProjects, setRemoteProjects] = useState<Project[] | null>(null);
  const [coupleMessages, setCoupleMessages] = useState<CoupleMessages>(loadCoupleMessages());
  const [isEditingCouple, setIsEditingCouple] = useState(false);
  const [editDraft, setEditDraft] = useState<CoupleMessages>(coupleMessages);

  useEffect(() => {
    setUserProjects(loadUserProjects());
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    listProjects(roomCode)
      .then((projects) => {
        console.log('✅ Supabase에서 프로젝트 로드 성공:', projects.length, '개');
        setRemoteProjects(projects);
      })
      .catch((e) => {
        console.error('❌ Supabase 프로젝트 로드 실패:', e);
        setRemoteProjects(projects); // 기본 데이터로 fallback
      });

    unsub = subscribeRoom(roomCode, async () => {
      try {
        const updated = await listProjects(roomCode);
        console.log('🔄 Supabase 실시간 업데이트:', updated.length, '개');
        setRemoteProjects(updated);
      } catch (e) {
        console.error('❌ Supabase 실시간 업데이트 실패:', e);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [roomCode]);

  const allProjects = useMemo(() => {
    const map = new Map<string, Project>();
    // LocalStorage 프로젝트 우선 (같은 slug면 덮어씀)
    for (const p of userProjects) map.set(p.slug, p);
    // Supabase 프로젝트 추가 (LocalStorage에 없는 것만)
    const base = remoteProjects ?? [];
    for (const p of base) {
      if (!map.has(p.slug)) {
        map.set(p.slug, p);
      }
    }
    // Supabase에 데이터가 없으면 기본 프로젝트 표시
    if (map.size === 0 && !remoteProjects) {
      for (const p of projects) map.set(p.slug, p);
    }
    return Array.from(map.values());
  }, [userProjects, remoteProjects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50">
            <PetalFall />
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 md:py-32">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                  이재헌 ❤️ 정은지
                </h1>
                <p className="text-xl md:text-2xl text-gray-800 mb-4">
                  인생의 동반자로써 같이 미래를 걸어갈 예쁜 커플
                </p>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  서로에게 세상에서 가장 소중한 존재가 되기 위해 노력하고 있습니다
                </p>
              </div>
            </section>

      {/* 자기소개 섹션 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <h2 className="text-4xl font-bold mb-12 text-gray-900 text-center">
              About Us
            </h2>
          </FadeInSection>
          <FadeInSection delay={100}>
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl ring-1 ring-black/5 p-8 md:p-12 space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 leading-relaxed">
                  안녕하세요! 8월 26일 기적같은 인연으로 서로 사랑을 시작하게 된 이재헌과 정은지입니다.
                </p>
                <p className="text-gray-800 leading-relaxed">
                  서로 제일 큰 힘이 되어주고 웃음을 주고 받으며 미래를 같이 그려나가고 있습니다. 때때로 서운하거나 다툼이 있더라도 함께 현명하게 해결하며 더욱 아껴주고 예뻐지려 노력하는 커플이 되겠습니다. 평생 함께하자는 약속 잊지 않고 예쁜 사랑을 만들어 나가겠습니다.
                </p>
              </div>
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">우리의 한마디</h3>
                  {!isEditingCouple ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft(coupleMessages);
                        setIsEditingCouple(true);
                      }}
                      className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                    >
                      편집
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCouple(false);
                          setEditDraft(coupleMessages);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveCoupleMessages(editDraft);
                          setCoupleMessages(editDraft);
                          setIsEditingCouple(false);
                        }}
                        className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                      >
                        저장
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-xl p-6 ring-1 ring-black/5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      이재헌
                    </h3>
                    {!isEditingCouple ? (
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {coupleMessages.jaeheon}
                      </p>
                    ) : (
                      <textarea
                        value={editDraft.jaeheon}
                        onChange={(e) => setEditDraft({ ...editDraft, jaeheon: e.target.value })}
                        className="w-full min-h-24 rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                        placeholder="은지에게 하고 싶은 말을 적어주세요..."
                      />
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-fuchsia-100 rounded-xl p-6 ring-1 ring-black/5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      정은지
                    </h3>
                    {!isEditingCouple ? (
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {coupleMessages.eunji}
                      </p>
                    ) : (
                      <textarea
                        value={editDraft.eunji}
                        onChange={(e) => setEditDraft({ ...editDraft, eunji: e.target.value })}
                        className="w-full min-h-24 rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                        placeholder="재헌에게 하고 싶은 말을 적어주세요..."
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 프로젝트 목록 섹션 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <h2 className="text-4xl font-bold mb-12 text-gray-900 text-center">
              우리의 소중한 추억
            </h2>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allProjects.map((project, idx) => (
              <FadeInSection key={project.slug} delay={idx * 100}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="block bg-white/80 backdrop-blur rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-rose-50"
                >
                  <div className="relative h-64 md:h-80 overflow-hidden">
                    {project.heroImage ? (
                      project.heroImage.startsWith('data:') ? (
                        // dataURL은 일반 img 태그 사용
                        <img
                          src={project.heroImage}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector(`.${project.heroGradientClassName.split(' ')[0]}`)) {
                              const fallback = document.createElement('div');
                              fallback.className = `h-full w-full ${project.heroGradientClassName}`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        // URL은 Next.js Image 사용
                        <Image
                          src={project.heroImage}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector(`.${project.heroGradientClassName.split(' ')[0]}`)) {
                              const fallback = document.createElement('div');
                              fallback.className = `h-full w-full ${project.heroGradientClassName}`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      )
                    ) : (
                      <div className={`h-full w-full ${project.heroGradientClassName}`} />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                        {project.title}
                      </h3>
                      <span className="mt-1 text-sm text-gray-500">
                        자세히 →
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">
                      {project.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                </Link>
              </FadeInSection>
            ))}

            {/* + 새 추억 추가 카드 */}
            <FadeInSection delay={allProjects.length * 100}>
              <Link
                href="/projects/new"
                className="group flex flex-col justify-center items-center rounded-xl bg-white/60 backdrop-blur ring-1 ring-black/5 shadow-lg hover:shadow-2xl transition-shadow duration-300 min-h-[320px] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-rose-50"
              >
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-rose-200 to-violet-200 ring-1 ring-black/5 flex items-center justify-center text-4xl font-bold text-rose-600 group-hover:scale-105 transition-transform">
                  +
                </div>
                <div className="mt-5 text-xl font-bold text-gray-900">
                  새 추억 추가하기
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  클릭해서 새로운 페이지를 만들어보세요
                </div>
              </Link>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">
          평생 서로 사랑하자 약속!
        </p>
      </footer>
    </div>
  );
}

export default function Home() {
  return <RoomGate>{(roomCode) => <HomeInner roomCode={roomCode} />}</RoomGate>;
}
