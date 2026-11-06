-- ====================================================================
-- MYSPACE PRODUCTION DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ====================================================================

-- 1. PROFILES & USER PREFERENCES
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Prateek Anand',
  email text,
  initials text default 'PA',
  role text default 'Product Engineer',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text default 'dark',
  created_at timestamptz default now()
);

-- 2. DASHBOARDS
create table if not exists public.dashboards (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  icon text default 'FolderGit2',
  is_default boolean default false,
  is_archived boolean default false,
  created_at timestamptz default now()
);

-- 3. PROJECTS
create table if not exists public.projects (
  id text primary key,
  dashboard_id text references public.dashboards(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz default now()
);

-- 4. TASKS
create table if not exists public.tasks (
  id text primary key,
  dashboard_id text references public.dashboards(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null check (status in ('todo', 'in_progress', 'done', 'on_hold')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  category_tag text,
  project_code text,
  assignee_name text default 'Prateek Anand',
  assignee_initials text default 'PA',
  start_date text,
  due_date text,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. TASK SUBTASKS, COMMENTS, ATTACHMENTS
create table if not exists public.task_subtasks (
  id text primary key,
  task_id text references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.task_comments (
  id text primary key,
  task_id text references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  user_name text not null,
  user_initials text not null,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists public.task_attachments (
  id text primary key,
  task_id text references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  size text,
  type text,
  url text,
  created_at timestamptz default now()
);

-- 6. LINK CATEGORIES & SAVED LINKS
create table if not exists public.link_categories (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  icon text default 'Folder',
  color text default '#8b5cf6',
  order_index integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.saved_links (
  id text primary key,
  category_id text references public.link_categories(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  favicon text,
  icon_letter text,
  icon_bg text default '#1e293b',
  pinned boolean default false,
  notes text,
  click_count integer default 0,
  created_at timestamptz default now()
);

-- 7. VAULT FOLDERS & FILES
create table if not exists public.folders (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  parent_id text references public.folders(id) on delete cascade,
  color text default '#8b5cf6',
  created_at timestamptz default now()
);

create table if not exists public.files (
  id text primary key,
  folder_id text references public.folders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  size_bytes bigint default 0,
  size_formatted text,
  file_type text not null,
  extension text not null,
  storage_path text,
  content_data_url text,
  text_content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. NOTIFICATIONS
create table if not exists public.notifications (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning')),
  read boolean default false,
  action_page text,
  action_target_id text,
  created_at timestamptz default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.dashboards enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.link_categories enable row level security;
alter table public.saved_links enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can select and update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Standard User Data Policies
create policy "Users can manage own user_preferences" on public.user_preferences for all using (auth.uid() = user_id);
create policy "Users can manage own dashboards" on public.dashboards for all using (auth.uid() = user_id);
create policy "Users can manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can manage own task_subtasks" on public.task_subtasks for all using (auth.uid() = user_id);
create policy "Users can manage own task_comments" on public.task_comments for all using (auth.uid() = user_id);
create policy "Users can manage own task_attachments" on public.task_attachments for all using (auth.uid() = user_id);
create policy "Users can manage own link_categories" on public.link_categories for all using (auth.uid() = user_id);
create policy "Users can manage own saved_links" on public.saved_links for all using (auth.uid() = user_id);
create policy "Users can manage own folders" on public.folders for all using (auth.uid() = user_id);
create policy "Users can manage own files" on public.files for all using (auth.uid() = user_id);
create policy "Users can manage own notifications" on public.notifications for all using (auth.uid() = user_id);

-- Storage bucket for vault files
insert into storage.buckets (id, name, public)
values ('vault-files', 'vault-files', true)
on conflict (id) do nothing;

create policy "Users can upload vault files" on storage.objects for insert with check (bucket_id = 'vault-files' and auth.role() = 'authenticated');
create policy "Users can view vault files" on storage.objects for select using (bucket_id = 'vault-files');
create policy "Users can delete vault files" on storage.objects for delete using (bucket_id = 'vault-files' and auth.uid() = owner);
