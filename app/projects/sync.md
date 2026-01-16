## 동시 편집/동기화(Supabase) 설정

이 프로젝트는 **Supabase(Postgres + Realtime + Storage)** 를 붙이면, 커플이 동시에 편집해도 실시간으로 동기화되도록 확장할 수 있습니다.

### 1) 패키지 설치

```bash
npm i @supabase/supabase-js
```

### 2) 환경 변수 설정

프로젝트 루트에 `.env.local`을 만들고 아래를 채워주세요.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> 참고: 이 환경에서는 `.env*` 파일 생성이 차단될 수 있어 문서로 안내만 남겨두었습니다.

### 3) DB 스키마(테이블) 만들기

Supabase SQL Editor에서 아래를 실행하세요.

```sql
-- 커플(룸) 단위로 같이 편집하기 위한 room
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  couple_messages text, -- "우리의 한마디" 메시지 (JSON: {"jaeheon": "...", "eunji": "..."})
  created_at timestamptz not null default now()
);

-- 프로젝트(추억 페이지)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  slug text not null,
  title text not null,
  summary text not null,
  tags text[] not null default '{}',
  hero_gradient_class_name text not null default 'bg-gradient-to-br from-rose-300 to-pink-400',
  hero_image text, -- 카드 상단 대표 이미지 (dataURL 또는 URL)
  love_note text,
  story text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(room_code, slug)
);

-- 사진(추억)
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  image_url text not null,
  caption text,
  memory_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
before update on projects
for each row execute function set_updated_at();
```

### 4) Storage(사진 업로드용 버킷) 만들기

- Supabase Storage에서 버킷 생성: `memories`
- (권장) Public 버킷으로 시작하면 구현이 단순합니다. (나중에 Private + signed URL로 강화 가능)

### 5) rooms 테이블에 couple_messages 필드 추가 (필수)

기존 rooms 테이블에 "우리의 한마디" 메시지를 저장할 필드를 추가하세요.

**중요**: Supabase SQL Editor에서 **"EXPLAIN" 버튼을 누르지 말고**, 아래 SQL을 **그대로 실행**하세요.

```sql
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS couple_messages text;
```

> ⚠️ 참고: `EXPLAIN ANALYZE`는 `ALTER TABLE` 같은 DDL 명령어에는 사용할 수 없습니다. SQL Editor에서 쿼리를 선택하고 실행 버튼만 누르세요.

### 6) Realtime 켜기

Supabase 대시보드에서 Realtime을 활성화하세요:

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 에서 프로젝트 선택

2. **Database 메뉴 → Replication 이동**
   - 왼쪽 사이드바에서 `Database` 클릭
   - `Replication` 탭 클릭

3. **테이블별 Realtime 활성화**
   아래 테이블들의 Realtime을 켜주세요 (토글 스위치 ON):
   - ✅ `projects` - 프로젝트 변경 실시간 동기화
   - ✅ `memories` - 추억 사진 변경 실시간 동기화
   - ✅ `rooms` - "우리의 한마디" 메시지 실시간 동기화

   > 각 테이블 옆에 있는 토글 스위치를 켜면 됩니다. 활성화되면 초록색으로 표시됩니다.

### 7) (선택) 권한/RLS

실사용(외부 공개)이라면 RLS로 `room_code` 단위 접근을 제한해야 합니다.
지금은 “커플 둘만” 쓰는 이벤트 페이지라 빠른 적용을 위해 **초기에는 Public + room_code 공유 방식**으로 시작하는 걸 추천합니다.

