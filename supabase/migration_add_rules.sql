-- Rules table: couple rules that require mutual approval
create table public.rules (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  text text not null check (length(text) between 3 and 500),
  proposed_by uuid references auth.users(id) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.rules enable row level security;

create policy "Members can view rules" on public.rules
  for select using (couple_id = public.get_my_couple_id());

create policy "Members can propose rules" on public.rules
  for insert with check (couple_id = public.get_my_couple_id() and proposed_by = auth.uid());

create policy "Members can update rules" on public.rules
  for update using (couple_id = public.get_my_couple_id());

create policy "Members can delete rules" on public.rules
  for delete using (couple_id = public.get_my_couple_id());
