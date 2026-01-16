# 이재헌 ❤️ 정은지 - 커플 추억 앨범

Next.js + Supabase로 만든 커플 전용 추억 앨범 웹앱입니다. 둘이 동시에 편집하고 사진을 공유할 수 있어요.

## 주요 기능

- 💕 **커플 코드로 동시 편집**: 같은 코드를 입력하면 둘이 같은 앨범을 보면서 실시간 동기화
- 📸 **사진 업로드**: 각 추억 페이지에서 직접 사진 업로드 및 편집
- ✏️ **자유로운 편집**: 제목, 설명, 태그, 이벤트 문구 등 모든 내용 수정 가능
- 🌸 **로맨틱한 디자인**: 파스텔 톤과 꽃가루 이펙트로 이벤트 분위기

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Supabase 설정 (선택)

동시 편집/동기화를 원하면 Supabase 설정이 필요합니다:

1. `npm i @supabase/supabase-js` (이미 설치됨)
2. `.env.local` 파일 생성:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. `app/projects/sync.md` 파일의 SQL을 Supabase SQL Editor에서 실행
4. Storage 버킷 `memories` 생성 (Public)

자세한 내용은 `app/projects/sync.md` 참고

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 배포하기

**자세한 배포 가이드는 `DEPLOY.md` 파일을 참고하세요.**

간단 요약:
1. GitHub에 코드 업로드
2. Supabase 프로젝트 생성 및 설정
3. Vercel에서 GitHub 저장소 연결
4. Vercel에 환경변수 설정
5. 배포 완료!

## 프로젝트 구조

```
app/
  ├── page.tsx              # 메인 랜딩 페이지
  ├── projects/
  │   ├── data.ts          # 기본 프로젝트 데이터
  │   ├── storage.ts       # LocalStorage 유틸
  │   ├── supabaseRepo.ts  # Supabase 연동
  │   ├── [slug]/
  │   │   └── page.tsx     # 프로젝트 상세 페이지
  │   └── new/
  │       └── page.tsx     # 새 프로젝트 추가 페이지
  └── components/
      ├── FadeInSection.tsx # 스크롤 애니메이션
      └── PetalFall.tsx     # 꽃가루 이펙트
```

## 기술 스택

- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS 4** - 스타일링
- **Supabase** - 백엔드 (Postgres + Realtime + Storage)
- **LocalStorage** - Supabase 없이도 작동 (단일 기기만)

## 라이선스

Private - 개인 프로젝트
