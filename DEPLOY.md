# 배포 가이드

이 프로젝트를 Vercel에 배포하는 방법입니다.

## 1. GitHub에 코드 업로드

1. GitHub에서 새 저장소(repository) 생성
2. 로컬에서 아래 명령어 실행:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/너의계정/저장소이름.git
git push -u origin main
```

## 2. Supabase 설정

### 2-1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 → 회원가입/로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 리전 선택 (가장 가까운 곳)
5. 생성 완료까지 대기 (약 2분)

### 2-2. 환경변수 가져오기

1. Supabase 대시보드 → **Project Settings** → **API**
2. 아래 두 값을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2-3. 데이터베이스 테이블 생성

1. Supabase 대시보드 → **SQL Editor**
2. `app/projects/sync.md` 파일의 SQL 코드를 복사해서 실행
3. 실행 버튼 클릭 → "Success" 확인

### 2-4. Storage 버킷 생성

1. Supabase 대시보드 → **Storage**
2. "New bucket" 클릭
3. 이름: `memories`
4. **Public bucket** 체크 (나중에 Private로 변경 가능)
5. 생성

### 2-5. Realtime 활성화

1. Supabase 대시보드 → **Database** → **Replication**
2. 아래 테이블의 Realtime을 켜기:
   - `projects` ✅
   - `memories` ✅

## 3. Vercel 배포

### 3-1. Vercel 계정 생성

1. [Vercel](https://vercel.com) 접속 → GitHub로 로그인
2. "Add New..." → "Project" 클릭
3. 방금 만든 GitHub 저장소 선택
4. "Import" 클릭

### 3-2. 환경변수 설정

Vercel 프로젝트 설정에서:

1. **Settings** → **Environment Variables**
2. 아래 두 개 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Supabase에서 복사한 URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabase에서 복사한 anon key)
3. "Save" 클릭

### 3-3. 배포 실행

1. "Deploy" 버튼 클릭
2. 빌드 완료까지 대기 (약 2-3분)
3. 배포 완료 후 URL 확인 (예: `https://your-project.vercel.app`)

## 4. 배포 후 확인

1. 배포된 사이트 접속
2. "커플 코드 입력" 화면에서 코드 입력 (예: `jaeheon-eunji-2026`)
3. 프로젝트 추가/편집이 정상 작동하는지 확인
4. 다른 기기/브라우저에서 같은 코드로 접속해서 동기화 확인

## 5. 문제 해결

### 환경변수가 안 보여요
- Vercel에서 환경변수 설정 후 **재배포** 필요
- Settings → Deployments → 최신 배포의 "Redeploy" 클릭

### Supabase 연결이 안 돼요
- `.env.local`이 아닌 **Vercel의 Environment Variables**에 설정했는지 확인
- Supabase 대시보드에서 Project URL/Key가 정확한지 확인

### 사진이 안 올라가요
- Supabase Storage 버킷이 **Public**으로 설정되어 있는지 확인
- Storage → Policies에서 Public 읽기 권한 확인

## 6. 다음 단계 (선택)

- **커스텀 도메인**: Vercel Settings → Domains에서 도메인 연결
- **이미지 최적화**: Supabase Storage를 Cloudinary로 교체 (더 큰 용량)
- **인증 추가**: Supabase Auth로 로그인 기능 추가
