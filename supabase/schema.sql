-- Run this once in the Supabase SQL editor for a new project.
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

create table if not exists teachers (
  email text primary key
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  created_at timestamptz not null default now()
);

create table if not exists help_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_name text not null,
  topic text,
  duration_seconds integer,
  helped_at timestamptz not null default now()
);

-- Seed the first teacher. Add more rows here (or via the Supabase table
-- editor) as you roll this out to other teachers.
insert into teachers (email) values ('REPLACE_WITH_TEACHER_EMAIL@mckinnonsc.vic.edu.au')
on conflict (email) do nothing;

-- The anon key used by the app is public (it ships in the browser bundle),
-- so without RLS anyone could read/write classes and help_sessions directly
-- against Supabase, bypassing the Next.js API routes entirely. These
-- policies make the database itself enforce "only teachers can manage
-- classes and help-session history."

alter table teachers enable row level security;
alter table classes enable row level security;
alter table help_sessions enable row level security;

create or replace function is_teacher() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from teachers where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "teachers can read own row" on teachers;
create policy "teachers can read own row" on teachers
  for select using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "teachers manage classes" on classes;
create policy "teachers manage classes" on classes
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists "teachers manage help_sessions" on help_sessions;
create policy "teachers manage help_sessions" on help_sessions
  for all using (is_teacher()) with check (is_teacher());
