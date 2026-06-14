create table public.idea_goal_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, goal_id)
);

create index idea_goal_links_owner_idea_idx on public.idea_goal_links(owner_id, idea_id);
create index idea_goal_links_owner_goal_idx on public.idea_goal_links(owner_id, goal_id);

alter table public.idea_goal_links enable row level security;

create policy "Owner can manage idea goal links" on public.idea_goal_links for all to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.ideas
    where ideas.id = idea_goal_links.idea_id
      and ideas.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.goals
    where goals.id = idea_goal_links.goal_id
      and goals.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.ideas
    where ideas.id = idea_goal_links.idea_id
      and ideas.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.goals
    where goals.id = idea_goal_links.goal_id
      and goals.owner_id = auth.uid()
  )
);
