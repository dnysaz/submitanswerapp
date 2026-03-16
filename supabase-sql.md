# Supabase Setup — Complete SQL Reference

> Run all queries in: **Supabase Dashboard → SQL Editor → New Query**

---

## STEP 1 — Create Tables

```sql
-- 1a. Classes table
CREATE TABLE classes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 1b. Submissions table
CREATE TABLE submissions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama        TEXT NOT NULL,
  student_id  TEXT NOT NULL,
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  jawaban     TEXT NOT NULL,
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),

  -- Prevent the same student from submitting twice in the same class
  UNIQUE (student_id, class_id)
);
```

---

## STEP 2 — Disable Row Level Security

```sql
ALTER TABLE classes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
```

---

## STEP 3 — Storage Bucket (via Dashboard)

1. Go to **Storage** in the Supabase sidebar
2. Click **New bucket**
3. Name: `submissions`
4. Toggle **Public bucket** → ON
5. Click **Create bucket**

---

## STEP 4 — Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_PASSWORD=your_chosen_admin_password
```

Where to find the keys:
- **URL**: Supabase Dashboard → Settings → API → Project URL
- **Service Role Key**: Supabase Dashboard → Settings → API → `service_role` (secret)

---

## STEP 5 — If Upgrading from an Older Schema

Run this if the `submissions` table already exists without `student_id` or `class_id`:

```sql
-- Add missing columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS student_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS class_id   UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE submissions
  ADD CONSTRAINT unique_student_per_class UNIQUE (student_id, class_id);

-- Remove old unused columns (optional)
ALTER TABLE submissions DROP COLUMN IF EXISTS email;
```

---

## Useful Maintenance Queries

```sql
-- View all classes
SELECT * FROM classes ORDER BY created_at;

-- View all submissions with class name
SELECT
  s.id,
  s.nama,
  s.student_id,
  c.name  AS class_name,
  s.pdf_url,
  s.created_at
FROM submissions s
JOIN classes c ON s.class_id = c.id
ORDER BY s.created_at DESC;

-- Count submissions per class
SELECT
  c.name,
  COUNT(s.id) AS total
FROM classes c
LEFT JOIN submissions s ON s.class_id = c.id
GROUP BY c.name
ORDER BY c.name;

-- Find duplicate student IDs (should return empty if unique constraint works)
SELECT student_id, class_id, COUNT(*)
FROM submissions
GROUP BY student_id, class_id
HAVING COUNT(*) > 1;

-- Delete ALL submissions (reset, keeps classes)
DELETE FROM submissions;

-- Delete ALL classes (also deletes submissions via CASCADE)
DELETE FROM classes;

-- Delete a specific class by name
DELETE FROM classes WHERE name = 'Class Name Here';

-- Delete a specific student submission
DELETE FROM submissions
WHERE student_id = '2024001' AND class_id = 'paste-class-uuid-here';
```

---

## Full Reset (start over)

```sql
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS classes;

-- Then re-run STEP 1 and STEP 2 above
```
