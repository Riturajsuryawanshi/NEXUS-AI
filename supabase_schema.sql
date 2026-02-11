-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  avatar_url text,
  plan_type text default 'free',
  daily_file_limit int default 3,
  files_processed_today int default 0,
  ai_calls_remaining int default 5,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WORKSPACES (Clients)
create table if not exists public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  industry text,
  currency text default '$',
  business_context jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- JOBS (Analysis Tasks)
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  workspace_id uuid references public.workspaces(id), -- Optional: could be null if 'personal'
  file_path text,
  file_name text,
  file_size int,
  status text check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  summary jsonb,
  ai_result jsonb,
  chat_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.jobs enable row level security;

-- Policies (Drop first to allow re-run)
-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Workspaces
drop policy if exists "Users can view own workspaces" on public.workspaces;
create policy "Users can view own workspaces" on public.workspaces for select using (auth.uid() = owner_id);

drop policy if exists "Users can insert own workspaces" on public.workspaces;
create policy "Users can insert own workspaces" on public.workspaces for insert with check (auth.uid() = owner_id);

drop policy if exists "Users can update own workspaces" on public.workspaces;
create policy "Users can update own workspaces" on public.workspaces for update using (auth.uid() = owner_id);

-- Jobs
drop policy if exists "Users can view own jobs" on public.jobs;
create policy "Users can view own jobs" on public.jobs for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own jobs" on public.jobs;
create policy "Users can insert own jobs" on public.jobs for insert with check (auth.uid() = user_id);

-- TRIGGERS --
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on creation
-- Drop trigger first to avoid duplicates if re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  plan_type text check (plan_type in ('free', 'solo', 'pro', 'enterprise')),
  status text check (status in ('active', 'expired', 'cancelled')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

-- REPORT CREDITS
create table if not exists public.report_credits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  credits_available int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PAYMENT TRANSACTIONS
create table if not exists public.payment_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amount numeric,
  currency text,
  payment_type text check (payment_type in ('subscription', 'report_credit')),
  status text check (status in ('success', 'failed', 'pending')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Monetization Tables
alter table public.subscriptions enable row level security;
alter table public.report_credits enable row level security;
alter table public.payment_transactions enable row level security;

-- Subscriptions Policies
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- Credits Policies
drop policy if exists "Users can view own credits" on public.report_credits;
create policy "Users can view own credits" on public.report_credits for select using (auth.uid() = user_id);

-- Transactions Policies
drop policy if exists "Users can view own transactions" on public.payment_transactions;
create policy "Users can view own transactions" on public.payment_transactions for select using (auth.uid() = user_id);
