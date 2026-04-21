-- ============================================
-- MATHCHECK - Supabase Schema
-- รัน SQL นี้ใน Supabase SQL Editor
-- ============================================

-- 1. Profiles table (เก็บชื่อผู้ใช้)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now()
);

-- 2. Problems table (โจทย์คณิตศาสตร์)
create table if not exists problems (
  id serial primary key,
  question text not null,
  answer numeric not null,
  hint text,
  order_num integer not null default 0
);

-- 3. User Answers table (คำตอบของแต่ละ user)
create table if not exists user_answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  problem_id integer references problems(id) on delete cascade not null,
  answer_given numeric not null,
  is_correct boolean not null,
  attempt_count integer not null default 1,
  submitted_at timestamptz default now(),
  unique(user_id, problem_id)  -- 1 record per user per problem (upsert)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table profiles enable row level security;
alter table problems enable row level security;
alter table user_answers enable row level security;

-- Profiles: ทุกคนดูได้, แก้ได้เฉพาะตัวเอง
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Problems: ทุกคนดูได้ (read only)
create policy "Anyone can read problems"
  on problems for select using (true);

-- User Answers: ดูได้ทุกคน (สำหรับ ranking), แต่แก้/เพิ่มได้เฉพาะตัวเอง
create policy "Anyone can view answers (for ranking)"
  on user_answers for select using (true);

create policy "Users can insert their own answers"
  on user_answers for insert with check (auth.uid() = user_id);

create policy "Users can update their own answers"
  on user_answers for update using (auth.uid() = user_id);

-- ============================================
-- Trigger: Auto-create profile on signup
-- (ถ้าต้องการ username จะ set ตอน register)
-- ============================================

-- ============================================
-- Seed: ใส่โจทย์ตัวอย่าง (แก้ได้ตามต้องการ)
-- ============================================
insert into problems (question, answer, hint, order_num) values
  ('2 + 3 = ?', 5, 'บวกตรงๆ เลย', 1),
  ('15 - 8 = ?', 7, 'ลบออกจาก 15', 2),
  ('6 × 7 = ?', 42, 'คูณ 6 กับ 7', 3),
  ('81 ÷ 9 = ?', 9, '9 × ? = 81', 4),
  ('3² + 4² = ?', 25, 'ยกกำลัง แล้วบวก', 5),
  ('√144 = ?', 12, 'หารากที่สองของ 144', 6),
  ('(12 + 8) × 3 = ?', 60, 'วงเล็บก่อน', 7),
  ('100 ÷ 4 + 15 = ?', 40, 'หารก่อน บวกทีหลัง', 8),
  ('5! = ?', 120, '5 × 4 × 3 × 2 × 1', 9),
  ('2^10 = ?', 1024, '2 ยกกำลัง 10', 10),
  ('ถ้า x + 7 = 15, x = ?', 8, 'ย้ายข้างสมการ', 11),
  ('ถ้า 3x = 27, x = ?', 9, 'หารทั้งสองข้าง', 12),
  ('พื้นที่สี่เหลี่ยมจัตุรัส ด้านยาว 9 ซม. = ? ตร.ซม.', 81, 'ด้าน × ด้าน', 13),
  ('เส้นรอบวงวงกลม รัศมี 7 (π ≈ 22/7) = ?', 44, '2πr', 14),
  ('1 + 2 + 3 + ... + 10 = ?', 55, 'สูตร n(n+1)/2', 15)
on conflict do nothing;
