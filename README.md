# 🔢 MathCheck — เว็บเช็คคำตอบคณิตศาสตร์

เว็บไซต์สำหรับให้นักเรียนฝึกทำโจทย์คณิตศาสตร์ พร้อมระบบสมัคร/login และตารางอันดับ

## ✨ Features
- ✅ สมัครสมาชิก / เข้าสู่ระบบ (Supabase Auth)
- ✅ โจทย์คณิตศาสตร์ 15 ข้อ (เพิ่มได้)
- ✅ ส่งคำตอบได้ไม่จำกัดครั้ง
- ✅ สีเขียว = ถูก, สีแดง = ผิด, สีเทา = ยังไม่ทำ
- ✅ คำตอบแยกตาม user
- ✅ หน้า Ranking แสดงอันดับ

---

## 🚀 วิธี Setup (ทำตามขั้นตอน)

### ขั้นที่ 1: สร้าง Supabase Project

1. ไปที่ https://supabase.com → **New Project**
2. ตั้งชื่อ project และ password
3. เลือก region ใกล้ที่สุด (Singapore แนะนำสำหรับไทย)
4. รอ project สร้างเสร็จ (~2 นาที)

### ขั้นที่ 2: รัน SQL Schema

1. ใน Supabase Dashboard → **SQL Editor**
2. Copy ทั้งหมดจากไฟล์ `supabase/schema.sql`
3. วาง → **Run**

> ⚠️ สำคัญ: ต้องไปที่ **Authentication → Settings → Email** แล้ว **ปิด "Confirm email"** ไม่งั้นสมัครแล้ว login ไม่ได้ทันที

### ขั้นที่ 3: เอา API Keys

1. Supabase Dashboard → **Settings → API**
2. Copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public key**

### ขั้นที่ 4: Setup โปรเจค

```bash
# Clone หรือ copy ไฟล์ทั้งหมดแล้วรัน
npm install

# สร้างไฟล์ .env.local
cp .env.local.example .env.local
```

แก้ `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

ทดสอบ local:
```bash
npm run dev
# เปิด http://localhost:3000
```

---

### ขั้นที่ 5: Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub (สร้าง repo ใหม่)
2. ไปที่ https://vercel.com → **New Project** → Import repo นั้น
3. ใน **Environment Variables** ใส่:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. กด **Deploy** รอสัก 1-2 นาที

เสร็จแล้วได้ URL สาธารณะใช้งานได้เลย! 🎉

---

## 📝 การแก้โจทย์

เปิดไฟล์ `supabase/schema.sql` ส่วน Seed ด้านล่าง แก้ไขโจทย์ตามต้องการ:

```sql
insert into problems (question, answer, hint, order_num) values
  ('2 + 3 = ?', 5, 'บวกตรงๆ เลย', 1),
  -- เพิ่มโจทย์ใหม่ได้เลย
  ('โจทย์ใหม่ = ?', คำตอบ, 'hint', ลำดับ);
```

หรือจะเพิ่มผ่าน Supabase Dashboard → **Table Editor → problems** ก็ได้

---

## 🏗️ โครงสร้างโปรเจค

```
src/
├── app/
│   ├── login/page.tsx       ← หน้า Login
│   ├── register/page.tsx    ← หน้าสมัคร
│   ├── problems/page.tsx    ← หน้าโจทย์ (หลัก)
│   ├── ranking/page.tsx     ← หน้าอันดับ
│   └── globals.css          ← styles ทั้งหมด
├── lib/supabase/
│   ├── client.ts            ← Supabase client (browser)
│   └── server.ts            ← Supabase client (server)
└── middleware.ts             ← ป้องกัน route (auth guard)
supabase/
└── schema.sql               ← Database schema + seed data
```

---

## ❓ FAQ

**Q: เพิ่มโจทย์แล้ว user เก่าต้องทำใหม่มั้ย?**
A: ไม่ต้อง โจทย์ใหม่จะขึ้นเป็นสีเทา (ยังไม่ทำ) ให้ทำต่อได้เลย

**Q: ลบ user ออกได้มั้ย?**
A: ได้ ใน Supabase → Authentication → Users → ลบได้เลย

**Q: แก้คำตอบที่ถูกแล้วได้มั้ย?**
A: ไม่ได้ ถ้าถูกแล้ว input จะล็อค (เพื่อป้องกันการแก้)

**Q: Ranking sort ยังไง?**
A: เรียงตาม (1) จำนวนข้อที่ถูกมากสุด (2) จำนวนครั้งที่ส่งน้อยสุด (ยิ่งส่งน้อยยิ่งเก่ง)
