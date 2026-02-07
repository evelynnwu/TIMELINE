-- Comments on works (images and essays)
create table public.work_comments (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now() not null,
  constraint work_comments_body_length check (char_length(body) between 1 and 2000)
);

alter table public.work_comments enable row level security;

-- RLS: authenticated read/insert/delete (only logged-in users can see or post comments)
create policy "Logged-in users can read comments" on public.work_comments for select to authenticated using (true);
create policy "Users can add comments" on public.work_comments for insert to authenticated with check (auth.uid() = author_id);
create policy "Users can delete own comments" on public.work_comments for delete to authenticated using (auth.uid() = author_id);

create index idx_work_comments_work on public.work_comments(work_id, created_at desc);
