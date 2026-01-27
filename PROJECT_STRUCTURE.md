# 프로젝트 구조 가이드

이 문서는 커플 추억 앨범 프로젝트의 전체 구조와 각 파일의 역할을 설명합니다.

## 📁 전체 프로젝트 구조

```
test_project/
├── app/                          # Next.js App Router (메인 애플리케이션)
│   ├── components/              # 재사용 가능한 컴포넌트
│   │   ├── FadeInSection.tsx   # 스크롤 애니메이션 컴포넌트
│   │   └── PetalFall.tsx       # 꽃가루 애니메이션 컴포넌트
│   ├── projects/                # 프로젝트(추억) 관련 기능
│   │   ├── [slug]/             # 동적 라우팅 (프로젝트 상세 페이지)
│   │   │   └── page.tsx        # 개별 추억 상세 페이지
│   │   ├── new/                # 새 추억 생성 페이지
│   │   │   └── page.tsx        # 새 추억 만들기 폼
│   │   ├── data.ts             # 프로젝트 타입 정의 및 기본 데이터
│   │   ├── storage.ts          # LocalStorage 관리 (클라이언트 저장소)
│   │   ├── supabaseRepo.ts     # Supabase 데이터베이스 연동
│   │   ├── room.ts             # 커플 코드(roomCode) 관리
│   │   ├── RoomGate.tsx        # 커플 코드 입력 게이트
│   │   └── sync.md             # Supabase 설정 가이드
│   ├── globals.css             # 전역 CSS 스타일
│   ├── layout.tsx              # 루트 레이아웃 (모든 페이지 공통)
│   └── page.tsx                # 메인 랜딩 페이지
├── lib/                         # 유틸리티 라이브러리
│   └── supabaseClient.ts       # Supabase 클라이언트 초기화
├── public/                      # 정적 파일 (이미지, 아이콘 등)
├── .env.local                   # 환경 변수 (Supabase 키 등)
├── next.config.ts              # Next.js 설정
├── package.json                # 프로젝트 의존성 및 스크립트
├── tsconfig.json               # TypeScript 설정
└── README.md                   # 프로젝트 개요

```

## 🎯 주요 파일 설명

### 1. **app/page.tsx** - 메인 랜딩 페이지
**역할**: 홈 화면, 프로젝트 목록 표시

**주요 기능**:
- "우리의 한마디" 섹션 (이재헌, 정은지 메시지)
- 프로젝트 카드 목록 표시
- 새 추억 추가 카드
- 꽃가루 애니메이션
- 스크롤 페이드인 애니메이션

**데이터 흐름**:
```
LocalStorage → Supabase → 화면 표시
```

**핵심 상태 관리**:
- `userProjects`: LocalStorage에서 불러온 프로젝트
- `remoteProjects`: Supabase에서 불러온 프로젝트
- `coupleMessages`: "우리의 한마디" 메시지
- `allProjects`: 두 소스를 합친 최종 프로젝트 목록

---

### 2. **app/projects/[slug]/page.tsx** - 추억 상세 페이지
**역할**: 개별 추억의 상세 정보 표시 및 편집

**주요 기능**:
- 대표 이미지 표시
- 추억 사진 갤러리
- 제목, 요약, 태그, 사랑의 메시지, 스토리 표시
- 편집 모드 (수정, 삭제, 사진 추가/삭제)

**동적 라우팅**:
- `/projects/project-1` → `project-1` 슬러그의 프로젝트 표시
- Next.js의 `[slug]` 폴더 구조로 동적 라우팅 구현

**데이터 흐름**:
```
URL의 slug → Supabase/LocalStorage에서 프로젝트 찾기 → 화면 표시
```

---

### 3. **app/projects/new/page.tsx** - 새 추억 만들기
**역할**: 새로운 추억 페이지 생성

**주요 기능**:
- 제목, 요약, 태그 입력
- 대표 이미지 업로드
- 추억 사진 업로드
- 사랑의 메시지, 스토리 작성

**데이터 흐름**:
```
사용자 입력 → Supabase 저장 → LocalStorage 저장 → 메인 페이지로 이동
```

---

### 4. **app/projects/data.ts** - 데이터 타입 정의
**역할**: 프로젝트 데이터 구조 정의

**주요 타입**:
```typescript
type Project = {
  slug: string;              // 고유 식별자 (URL에 사용)
  title: string;             // 제목
  summary: string;           // 요약
  tags: string[];           // 태그 배열
  heroImage?: string;        // 대표 이미지 (dataURL 또는 URL)
  heroGradientClassName: string; // 대표 이미지 없을 때 그라데이션
  loveNote?: string;         // 사랑의 메시지
  story?: string;            // 스토리
  memories: Memory[];        // 추억 사진 배열
};

type Memory = {
  src: string;               // 이미지 URL 또는 dataURL
  alt: string;               // 대체 텍스트
  caption?: string;          // 사진 설명
  date?: string;            // 날짜
};
```

---

### 5. **app/projects/storage.ts** - LocalStorage 관리
**역할**: 브라우저 로컬 저장소 관리

**주요 함수**:
- `loadUserProjects()`: LocalStorage에서 프로젝트 불러오기
- `saveUserProjects()`: LocalStorage에 프로젝트 저장 (dataURL 제외)
- `upsertUserProject()`: 프로젝트 추가/업데이트
- `deleteUserProject()`: 프로젝트 삭제

**중요**: 
- dataURL은 용량이 크므로 LocalStorage에 저장하지 않음
- Supabase에만 전체 데이터 저장, LocalStorage는 메타데이터만

---

### 6. **app/projects/supabaseRepo.ts** - Supabase 연동
**역할**: Supabase 데이터베이스와의 모든 통신

**주요 함수**:

**프로젝트 관리**:
- `listProjects(roomCode)`: 특정 roomCode의 모든 프로젝트 불러오기
- `upsertProject(roomCode, project)`: 프로젝트 저장/업데이트
- `deleteProject(roomCode, slug)`: 프로젝트 삭제

**"우리의 한마디" 관리**:
- `loadCoupleMessages(roomCode)`: 메시지 불러오기
- `saveCoupleMessages(roomCode, messages)`: 메시지 저장

**실시간 동기화**:
- `subscribeRoom(roomCode, onChange)`: 실시간 변경 감지 구독

**데이터베이스 구조**:
```
rooms (커플 코드)
  ├── code: string
  └── couple_messages: text (JSON)

projects (추억 페이지)
  ├── id: uuid
  ├── room_code: string
  ├── slug: string
  ├── title: string
  ├── hero_image: text
  └── ...

memories (추억 사진)
  ├── id: uuid
  ├── project_id: uuid
  ├── image_url: text
  ├── caption: text
  └── ...
```

---

### 7. **app/projects/RoomGate.tsx** - 커플 코드 게이트
**역할**: 처음 접속 시 커플 코드 입력 요청

**동작 방식**:
1. LocalStorage에서 roomCode 확인
2. 없으면 입력 폼 표시
3. 입력 후 Supabase에 room 생성/확인
4. LocalStorage에 저장 (다음 접속 시 자동 로드)

**중요**: 같은 roomCode를 사용하는 두 기기만 데이터 공유

---

### 8. **lib/supabaseClient.ts** - Supabase 클라이언트
**역할**: Supabase 클라이언트 초기화 및 관리

**기능**:
- 환경 변수에서 URL, ANON_KEY 읽기
- Supabase 클라이언트 인스턴스 생성 및 캐싱
- 싱글톤 패턴으로 중복 생성 방지

---

### 9. **app/components/FadeInSection.tsx** - 페이드인 애니메이션
**역할**: 스크롤 시 요소가 서서히 나타나는 애니메이션

**기술**:
- Intersection Observer API 사용
- 스크롤 위치 감지하여 애니메이션 트리거

---

### 10. **app/components/PetalFall.tsx** - 꽃가루 애니메이션
**역할**: 배경 꽃가루 떨어지는 애니메이션

**기술**:
- HTML5 Canvas API 사용
- 물리 시뮬레이션 (중력, 바람, 흔들림)

---

## 🔄 데이터 흐름 (Data Flow)

### 1. **프로젝트 저장 흐름**
```
사용자 입력 (폼)
  ↓
[slug]/page.tsx 또는 new/page.tsx
  ↓
upsertProject(roomCode, project) → Supabase 저장
  ↓
upsertUserProject(project) → LocalStorage 저장 (메타데이터만)
  ↓
listProjects(roomCode) → 최신 데이터 다시 불러오기
  ↓
화면 업데이트
```

### 2. **프로젝트 로드 흐름**
```
페이지 로드
  ↓
RoomGate → roomCode 확인
  ↓
listProjects(roomCode) → Supabase에서 불러오기
  ↓
loadUserProjects() → LocalStorage에서 불러오기
  ↓
allProjects = merge(Supabase, LocalStorage)
  ↓
화면 표시
```

### 3. **실시간 동기화 흐름**
```
기기 A에서 저장
  ↓
Supabase에 저장
  ↓
Supabase Realtime 이벤트 발생
  ↓
기기 B의 subscribeRoom 콜백 실행
  ↓
listProjects() → 최신 데이터 다시 불러오기
  ↓
화면 자동 업데이트
```

---

## 🛠️ 기술 스택

### Frontend
- **Next.js 16**: React 프레임워크 (App Router)
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 유틸리티 CSS 프레임워크
- **React Hooks**: 상태 관리 (useState, useEffect, useMemo)

### Backend & Database
- **Supabase**: 
  - PostgreSQL 데이터베이스
  - Realtime 구독 (실시간 동기화)
  - Storage (이미지 저장, 현재는 DB에 dataURL 저장)

### 클라이언트 저장소
- **LocalStorage**: 메타데이터 캐싱 (dataURL 제외)

---

## 📊 상태 관리 패턴

### 1. **로컬 상태 (Local State)**
- `useState`로 컴포넌트 내부 상태 관리
- 예: `isEditing`, `draft`, `coupleMessages`

### 2. **서버 상태 (Server State)**
- Supabase에서 불러온 데이터
- `remoteProjects`, `coupleMessages` (Supabase 버전)

### 3. **캐시 상태 (Cache State)**
- LocalStorage에 저장된 데이터
- `userProjects`, `coupleMessages` (LocalStorage 버전)

### 4. **계산된 상태 (Computed State)**
- `useMemo`로 여러 소스에서 계산된 값
- `allProjects`: Supabase + LocalStorage 병합

---

## 🔐 보안 및 권한

### 현재 구조
- **Public 접근**: roomCode만 알면 접근 가능
- **RLS (Row Level Security)**: 미적용 (개인 프로젝트이므로)

### 향후 개선 가능
- Supabase RLS 정책 추가
- roomCode 기반 접근 제어
- 이미지 Storage 사용 (현재는 DB에 dataURL)

---

## 🚀 배포 구조

### Vercel 배포
1. GitHub에 코드 푸시
2. Vercel이 자동으로 빌드 및 배포
3. 환경 변수 설정 (Supabase URL, KEY)

### 환경 변수
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 📝 학습 포인트

### 1. **Next.js App Router**
- `app/` 폴더 구조
- 동적 라우팅 `[slug]`
- Server/Client Components 구분

### 2. **React Hooks**
- `useState`: 상태 관리
- `useEffect`: 사이드 이펙트 (데이터 로드, 구독)
- `useMemo`: 계산된 값 메모이제이션

### 3. **TypeScript**
- 타입 정의 (`type`, `interface`)
- 제네릭 사용
- 타입 안정성

### 4. **Supabase**
- PostgreSQL 쿼리
- Realtime 구독
- Upsert 패턴

### 5. **상태 관리 패턴**
- 로컬 상태 vs 서버 상태
- 캐싱 전략
- 실시간 동기화

---

## 🎓 다음 단계 학습 추천

1. **Next.js 심화**: Server Actions, Middleware, API Routes
2. **상태 관리**: Zustand, Jotai 같은 상태 관리 라이브러리
3. **이미지 최적화**: Supabase Storage 사용, 이미지 리사이징
4. **인증**: Supabase Auth로 사용자 인증 추가
5. **테스트**: Jest, React Testing Library
6. **성능 최적화**: React.memo, useCallback, 이미지 최적화

---

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs)

---

이 문서는 프로젝트의 전체 구조를 이해하는 데 도움이 되기를 바랍니다. 각 파일을 열어보면서 코드를 읽어보시면 더 깊이 이해할 수 있습니다! 🚀
