-- ====================================================================
-- MYSPACE OPTION A: HYBRID AUTHENTICATION SCHEMA (SUPABASE AUTH ONLY)
-- ====================================================================
-- Architecture:
--   * Supabase Auth (auth.users) = Authoritative User Identity & Directory
--   * Local IndexedDB            = Device-Isolated AES-256-GCM Workspaces
--   * Manual .myspace.enc        = Encrypted Cross-Device Portability
--
-- Workspace entities (Links, Categories, Work List tasks, Dashboards,
-- MyVault folders & files) are NEVER uploaded to PostgreSQL or Storage.
--
-- Private Admin Directory:
--   Use Supabase Dashboard -> Authentication -> Users (or trusted
--   server-side Admin API with service_role key never exposed to clients).
-- ====================================================================

-- 1. OPTIONAL USER PROFILE CACHE (Strictly Owner-Only RLS)
-- Stores non-sensitive display metadata synced from Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'MySpace User',
  email text,
  initials text default 'MU',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Drop legacy/permissive policies if re-running
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Strict Row Level Security: users can ONLY read/insert/update their own row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ====================================================================
-- 2. SECURITY HARDENING: REMOVE INSECURE PUBLIC STORAGE POLICIES
-- ====================================================================
-- MyVault files are encrypted and stored locally in IndexedDB only.
-- If an older deployment created a public `vault-files` bucket with
-- unrestricted read access, lock it down and drop public policies.
drop policy if exists "Users can view vault files" on storage.objects;
drop policy if exists "Users can upload vault files" on storage.objects;
drop policy if exists "Users can delete vault files" on storage.objects;

update storage.buckets
set public = false
where id = 'vault-files';
