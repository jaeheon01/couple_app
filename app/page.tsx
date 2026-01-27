'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import FadeInSection from './components/FadeInSection';
import PetalFall from './components/PetalFall';
import { projects } from './projects/data';
import type { Project } from './projects/data';
import { deleteUserProject, loadUserProjects } from './projects/storage';
import RoomGate from './projects/RoomGate';
import { deleteProject, loadCoupleMessages, listProjects, saveCoupleMessages, subscribeRoom } from './projects/supabaseRepo';

type CoupleMessages = {
  jaeheon: string;
  eunji: string;
};

const COUPLE_MESSAGES_KEY = 'jaeheon-portfolio-couple-messages-v1';

function loadCoupleMessagesLocal(): CoupleMessages {
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

function saveCoupleMessagesLocal(messages: CoupleMessages) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COUPLE_MESSAGES_KEY, JSON.stringify(messages));
}

function HomeInner({ roomCode }: { roomCode: string }) {
  console.log('🏠 HomeInner 렌더링, roomCode:', roomCode);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [remoteProjects, setRemoteProjects] = useState<Project[] | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [coupleMessages, setCoupleMessages] = useState<CoupleMessages>(loadCoupleMessagesLocal());
  const [isEditingCouple, setIsEditingCouple] = useState(false);
  const [editDraft, setEditDraft] = useState<CoupleMessages>(coupleMessages);

  useEffect(() => {
    setUserProjects(loadUserProjects());
    
    // Supabase에서 couple_messages 불러오기
    loadCoupleMessages(roomCode)
      .then((remoteMessages) => {
        if (remoteMessages) {
          console.log('✅ Supabase에서 couple_messages 로드 성공:', remoteMessages);
          setCoupleMessages(remoteMessages);
          saveCoupleMessagesLocal(remoteMessages); // LocalStorage에도 저장
        } else {
          // Supabase에 없으면 LocalStorage에서 로드
          const localMessages = loadCoupleMessagesLocal();
          console.log('📝 LocalStorage에서 couple_messages 로드:', localMessages);
          setCoupleMessages(localMessages);
        }
      })
      .catch((e) => {
        console.error('❌ Supabase couple_messages 로드 실패:', e);
        // 실패 시 LocalStorage에서 로드
        const localMessages = loadCoupleMessagesLocal();
        setCoupleMessages(localMessages);
      });
  }, [roomCode]);

  // LocalStorage 변경 감지 (다른 탭에서 저장했을 때)
  useEffect(() => {
    const handleStorageChange = () => {
      setUserProjects(loadUserProjects());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    setIsLoadingProjects(true);

    console.log('🔄 Supabase 프로젝트 로드 시작...', { roomCode });
    listProjects(roomCode)
      .then((projects) => {
        console.log('✅ Supabase에서 프로젝트 로드 성공:', projects.length, '개');
        console.log('📦 로드된 프로젝트:', projects.map(p => ({ slug: p.slug, title: p.title, memoriesCount: p.memories.length })));
        setRemoteProjects(projects);
        setIsLoadingProjects(false);
      })
      .catch((e) => {
        console.error('❌ Supabase 프로젝트 로드 실패:', e);
        console.error('에러 상세:', JSON.stringify(e, null, 2));
        // 실패 시에도 빈 배열로 설정하여 LocalStorage 데이터가 표시되도록 함
        setRemoteProjects([]);
        setIsLoadingProjects(false);
      });

    unsub = subscribeRoom(roomCode, async () => {
      try {
        // 프로젝트 업데이트
        const updated = await listProjects(roomCode);
        console.log('🔄 Supabase 실시간 업데이트:', updated.length, '개');
        setRemoteProjects(updated);
        
        // couple_messages도 실시간 업데이트
        const updatedMessages = await loadCoupleMessages(roomCode);
        if (updatedMessages) {
          console.log('🔄 Supabase couple_messages 실시간 업데이트:', updatedMessages);
          setCoupleMessages(updatedMessages);
          saveCoupleMessagesLocal(updatedMessages); // LocalStorage에도 저장
        } else {
          console.log('⚠️ couple_messages 실시간 업데이트: 데이터 없음');
        }
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
    
    // 로딩 중이면 빈 배열 반환 (로딩 완료 후 다시 계산됨)
    if (isLoadingProjects && remoteProjects === null) {
      console.log('⏳ 프로젝트 로딩 중...');
      return [];
    }
    
    // 1. Supabase 프로젝트 먼저 추가 (최신 데이터)
    // remoteProjects가 null이면 빈 배열로 처리 (로딩 실패 또는 데이터 없음)
    const base = remoteProjects ?? [];
    for (const p of base) {
      map.set(p.slug, p);
    }
    
    // 2. LocalStorage 프로젝트 추가 (Supabase에 없는 것만, 또는 Supabase 데이터 보완)
    // 다른 컴퓨터에서는 LocalStorage가 비어있을 수 있으므로 Supabase 데이터만 사용
    for (const p of userProjects) {
      if (!map.has(p.slug)) {
        // Supabase에 없으면 LocalStorage 데이터 사용
        map.set(p.slug, p);
      } else {
        // Supabase에 있으면 Supabase 데이터 사용 (이미지 포함)
        // LocalStorage는 dataURL이 제거되어 있으므로 Supabase 우선
      }
    }
    
    // 3. 기본 프로젝트 추가 (둘 다 없을 때만)
    // 로딩이 완료되었고 (isLoadingProjects === false) 데이터가 없을 때만 기본 프로젝트 표시
    if (!isLoadingProjects && map.size === 0) {
      for (const p of projects) map.set(p.slug, p);
    }
    
    const result = Array.from(map.values());
    console.log('📋 allProjects:', result.length, '개', result.map(p => p.slug), '로딩중:', isLoadingProjects);
    console.log('📋 allProjects 상세:', result.map(p => ({ 
      slug: p.slug, 
      title: p.slug, 
      hasHeroImage: !!p.heroImage,
      memoriesCount: p.memories.length 
    })));
    return result;
  }, [userProjects, remoteProjects, isLoadingProjects]);

  const handleDeleteProject = async (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const project = allProjects.find(p => p.slug === slug);
    if (!project) return;
    
    if (!confirm(`"${project.title}" 추억을 정말 삭제하시겠어요?\n\n삭제된 추억은 복구할 수 없어요.`)) {
      return;
    }

    try {
      // Supabase에서 삭제
      await deleteProject(roomCode, slug);
      console.log('✅ Supabase에서 프로젝트 삭제 완료');
      
      // LocalStorage에서 삭제
      deleteUserProject(slug);
      
      // 상태 업데이트
      setUserProjects(loadUserProjects());
      
      // Supabase에서 최신 데이터 다시 불러오기
      try {
        const updated = await listProjects(roomCode);
        console.log('🔄 삭제 후 Supabase 데이터 새로고침:', updated.length, '개');
        setRemoteProjects(updated);
      } catch (e) {
        console.error('❌ 삭제 후 데이터 새로고침 실패:', e);
      }
      
      alert('✅ 추억이 삭제되었어요.');
    } catch (e: any) {
      console.error('❌ 프로젝트 삭제 실패:', e);
      const errorMsg = e?.message || String(e);
      alert(`❌ 삭제 실패:\n${errorMsg}\n\n콘솔을 확인해주세요.`);
    }
  };

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
                        onClick={async () => {
                          try {
                            // Supabase에 저장
                            await saveCoupleMessages(roomCode, editDraft);
                            console.log('✅ Supabase couple_messages 저장 성공');
                            
                            // LocalStorage에도 저장
                            saveCoupleMessagesLocal(editDraft);
                            
                            // 상태 업데이트
                            setCoupleMessages(editDraft);
                            setIsEditingCouple(false);
                            
                            alert('✅ 저장 완료! 다른 기기에서도 보일 거예요.');
                          } catch (e: any) {
                            console.error('❌ Supabase couple_messages 저장 실패:', e);
                            const errorMsg = e?.message || String(e);
                            
                            // Supabase 실패 시에도 LocalStorage에 저장
                            saveCoupleMessagesLocal(editDraft);
                            setCoupleMessages(editDraft);
                            setIsEditingCouple(false);
                            
                            alert(`⚠️ Supabase 동기화 실패했지만 로컬에는 저장했어요.\n\n에러: ${errorMsg}\n\n다른 기기에서는 보이지 않을 수 있어요.`);
                          }
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
          {isLoadingProjects ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
              <p className="mt-4 text-gray-600">추억을 불러오는 중...</p>
            </div>
          ) : allProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">아직 저장된 추억이 없어요.</p>
              <Link
                href="/projects/new"
                className="inline-block rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
              >
                첫 추억 만들기
              </Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allProjects.map((project, idx) => (
              <FadeInSection key={project.slug} delay={idx * 100}>
                <div className="relative group">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="block bg-white/80 backdrop-blur rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-rose-50"
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
                <button
                  type="button"
                  onClick={(e) => handleDeleteProject(project.slug, e)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg z-10"
                  aria-label="삭제"
                  title="추억 삭제"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
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
          )}
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
