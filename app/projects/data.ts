export type Project = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  heroGradientClassName: string;
  heroImage?: string; // 카드 상단 대표 이미지 (있으면 이미지, 없으면 그라데이션)
  loveNote?: string;
  story?: string;
  timeline?: { date: string; title: string; note?: string }[];
  memories: { src: string; alt: string; caption?: string; date?: string }[];
};

// TODO: 아래 데이터는 샘플입니다. 실제 프로젝트 정보/이미지로 교체해 주세요.
// 추억 사진은 아래처럼 넣는 걸 추천합니다:
// - `public/projects/<slug>/01.jpg`
// - `public/projects/<slug>/02.jpg`
// - ...
// 그리고 src는 `/projects/<slug>/01.jpg` 처럼 절대 경로로 지정하면 됩니다.
export const projects: Project[] = [
  {
    slug: 'project-1',
    title: '프로젝트 1',
    summary:
      '프로젝트에 대한 간단한 설명이 들어갑니다. 문제 정의, 해결 방식, 성과를 2~3줄로 요약해보세요.',
    tags: ['React', 'Next.js'],
    heroGradientClassName:
      'bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800',
    loveNote:
      '우리의 순간들을 모아두는 작은 앨범. 오늘도 고마워, 그리고 앞으로도 잘 부탁해.',
    story:
      '여기에는 그 날의 공기, 표정, 대화 같은 걸 짧게라도 남겨두면 나중에 다시 봤을 때 더 따뜻해져요.',
    timeline: [
      { date: '2025-08-26', title: '우리의 시작', note: '기적같이 이어진 인연' },
      { date: '2025-12-24', title: '겨울의 추억', note: '따뜻했던 하루' },
    ],
    memories: [
      {
        src: '/projects/project-1/01.jpg',
        alt: '추억 1',
        caption: '처음 같이 갔던 곳',
        date: '2025-05-12',
      },
      {
        src: '/projects/project-1/02.jpg',
        alt: '추억 2',
        caption: '웃음이 멈추지 않던 날',
        date: '2025-08-03',
      },
      {
        src: '/projects/project-1/03.jpg',
        alt: '추억 3',
        caption: '우리만 아는 작은 행복',
        date: '2025-12-24',
      },
    ],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug) ?? null;
}

