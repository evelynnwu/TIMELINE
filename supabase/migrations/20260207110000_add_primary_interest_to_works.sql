-- Add primary_interest_id column to works table
alter table public.works
  add column primary_interest_id uuid references public.interests(id) on delete set null;

-- Add index for performance
create index works_primary_interest_idx on public.works (primary_interest_id);
