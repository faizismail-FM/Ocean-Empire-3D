-- Ocean Empire 3D — optional Supabase schema.
--
-- The game runs entirely from browser storage without this. When NEXT_PUBLIC_SUPABASE_URL
-- and NEXT_PUBLIC_SUPABASE_ANON_KEY are set, the client mirrors saves here using
-- anonymous auth, so every row is owned by an auth.users id and protected by RLS.
--
-- Design: immutable historical reference data lives in the application bundle
-- (src/data) and is versioned with the code; only player state is stored here.
-- The `saves` table holds the validated game-state document the client works with.
-- The normalised tables below are projections of that document for querying,
-- leaderboards and future server-side features; they are populated by the
-- `project_save()` trigger so the client never writes them directly.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core save document
create table if not exists public.saves (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  summary jsonb not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saves_user_idx on public.saves (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Normalised projections (read-only for clients)
create table if not exists public.empires (
  save_id text primary key references public.saves (id) on delete cascade,
  user_id uuid not null,
  name text not null,
  mode text not null,
  scenario_id text not null,
  polity_id text,
  is_fictional boolean not null default true,
  treasury numeric not null,
  game_date date,
  campaign_status text not null
);

create table if not exists public.ships (
  save_id text not null references public.saves (id) on delete cascade,
  ship_id text not null,
  class_id text not null,
  name text not null,
  status text not null,
  docked_port_id text,
  lat double precision not null,
  lon double precision not null,
  heading double precision not null,
  speed_knots double precision not null,
  endurance double precision not null,
  condition double precision not null,
  primary key (save_id, ship_id)
);

create table if not exists public.fleet_assignments (
  save_id text not null references public.saves (id) on delete cascade,
  ship_id text not null,
  destination_port_id text,
  autopilot boolean not null,
  waypoint_index integer not null,
  primary key (save_id, ship_id)
);

create table if not exists public.voyages (
  save_id text not null references public.saves (id) on delete cascade,
  voyage_id text not null,
  ship_id text not null,
  origin_port_id text not null,
  destination_port_id text not null,
  distance_nm numeric not null,
  revenue numeric not null,
  expenses numeric not null,
  net numeric not null,
  arrived_sim_seconds numeric not null,
  primary key (save_id, voyage_id)
);

create table if not exists public.contracts (
  save_id text not null references public.saves (id) on delete cascade,
  contract_id text not null,
  origin_port_id text not null,
  destination_port_id text not null,
  good_id text not null,
  quantity numeric not null,
  payment numeric not null,
  status text not null,
  assigned_ship_id text,
  paid boolean not null,
  primary key (save_id, contract_id)
);

create table if not exists public.cargo (
  save_id text not null references public.saves (id) on delete cascade,
  ship_id text not null,
  good_id text not null,
  quantity numeric not null,
  contract_id text,
  primary key (save_id, ship_id, good_id, contract_id)
);

create table if not exists public.port_development (
  save_id text not null references public.saves (id) on delete cascade,
  port_id text not null,
  access text not null,
  visited boolean not null,
  infrastructure jsonb not null,
  influence numeric not null,
  primary key (save_id, port_id)
);

create table if not exists public.territories (
  save_id text not null references public.saves (id) on delete cascade,
  port_id text not null,
  kind text not null check (kind in ('home', 'agreement')),
  primary key (save_id, port_id)
);

create table if not exists public.technologies (
  save_id text not null references public.saves (id) on delete cascade,
  technology_id text not null,
  primary key (save_id, technology_id)
);

create table if not exists public.diplomacy (
  save_id text not null references public.saves (id) on delete cascade,
  polity_id text not null,
  relation numeric not null,
  agreements text[] not null,
  primary key (save_id, polity_id)
);

create table if not exists public.achievements (
  save_id text not null references public.saves (id) on delete cascade,
  objective_id text not null,
  completed_sim_seconds numeric,
  primary key (save_id, objective_id)
);

-- Reference catalogue identifiers, for joins and analytics. The authoritative records
-- (with sources and evidence status) are in src/data; these rows mirror ids and titles.
create table if not exists public.historical_scenarios (
  id text primary key,
  title text not null,
  mode text not null,
  start_date text not null,
  end_date text not null
);
create table if not exists public.historical_events (
  id text primary key,
  title text not null,
  start_year integer not null,
  end_year integer,
  evidence_status text not null
);
create table if not exists public.historical_sources (
  id text primary key,
  title text not null,
  author_or_institution text not null,
  publication_year integer,
  source_type text not null,
  url_or_reference text
);

-- ---------------------------------------------------------------------------
-- Projection trigger: keep the normalised tables in step with the save document.
create or replace function public.project_save() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s jsonb := new.state;
  ship jsonb;
  k text;
  v jsonb;
begin
  insert into empires (save_id, user_id, name, mode, scenario_id, polity_id, is_fictional, treasury, game_date, campaign_status)
  values (
    new.id, new.user_id, s->'empire'->>'name', s->>'mode', s->>'scenario_id', s->'empire'->>'polity_id',
    coalesce((s->'empire'->>'is_fictional')::boolean, true), (s->>'treasury')::numeric,
    make_date(greatest(1, (s->'date'->>'year')::int), (s->'date'->>'month')::int, (s->'date'->>'day')::int),
    s->'campaign'->>'status'
  )
  on conflict (save_id) do update set
    name = excluded.name, treasury = excluded.treasury, game_date = excluded.game_date, campaign_status = excluded.campaign_status;

  delete from ships where save_id = new.id;
  delete from fleet_assignments where save_id = new.id;
  delete from cargo where save_id = new.id;
  for k, v in select * from jsonb_each(s->'ships') loop
    ship := v;
    insert into ships (save_id, ship_id, class_id, name, status, docked_port_id, lat, lon, heading, speed_knots, endurance, condition)
    values (new.id, k, ship->>'class_id', ship->>'name', ship->>'status', ship->>'docked_port_id',
            (ship->'position'->>'lat')::float8, (ship->'position'->>'lon')::float8, (ship->>'heading')::float8,
            (ship->>'speed_knots')::float8, (ship->>'endurance')::float8, (ship->>'condition')::float8);
    insert into fleet_assignments (save_id, ship_id, destination_port_id, autopilot, waypoint_index)
    values (new.id, k, (ship->'route'->-1)->>'port_id', (ship->>'autopilot')::boolean, (ship->>'waypoint_index')::int);
    insert into cargo (save_id, ship_id, good_id, quantity, contract_id)
    select new.id, k, c->>'good_id', (c->>'quantity')::numeric, coalesce(c->>'contract_id', '')
    from jsonb_array_elements(ship->'cargo') c
    on conflict do nothing;
  end loop;

  delete from contracts where save_id = new.id;
  insert into contracts (save_id, contract_id, origin_port_id, destination_port_id, good_id, quantity, payment, status, assigned_ship_id, paid)
  select new.id, k2, v2->>'origin_port_id', v2->>'destination_port_id', v2->>'good_id', (v2->>'quantity')::numeric,
         (v2->>'payment')::numeric, v2->>'status', v2->>'assigned_ship_id', (v2->>'paid')::boolean
  from jsonb_each(s->'contracts') as e(k2, v2);

  delete from voyages where save_id = new.id;
  insert into voyages (save_id, voyage_id, ship_id, origin_port_id, destination_port_id, distance_nm, revenue, expenses, net, arrived_sim_seconds)
  select new.id, x->>'id', x->>'ship_id', x->>'origin_port_id', x->>'destination_port_id', (x->>'distance_nm')::numeric,
         (x->>'revenue')::numeric, (x->>'expenses')::numeric, (x->>'net')::numeric, (x->>'arrived_sim_seconds')::numeric
  from jsonb_array_elements(s->'voyages') x;

  delete from port_development where save_id = new.id;
  delete from territories where save_id = new.id;
  insert into port_development (save_id, port_id, access, visited, infrastructure, influence)
  select new.id, k3, v3->>'access', (v3->>'visited')::boolean, v3->'infrastructure', (v3->>'influence')::numeric
  from jsonb_each(s->'ports') as e(k3, v3);
  insert into territories (save_id, port_id, kind)
  select new.id, k3, v3->>'access' from jsonb_each(s->'ports') as e(k3, v3) where v3->>'access' in ('home', 'agreement');

  delete from technologies where save_id = new.id;
  insert into technologies (save_id, technology_id) select new.id, t from jsonb_array_elements_text(s->'technologies') t;

  delete from diplomacy where save_id = new.id;
  insert into diplomacy (save_id, polity_id, relation, agreements)
  select new.id, k4, (v4->>'relation')::numeric, array(select jsonb_array_elements_text(v4->'agreements'))
  from jsonb_each(s->'diplomacy') as e(k4, v4);

  delete from achievements where save_id = new.id;
  insert into achievements (save_id, objective_id, completed_sim_seconds)
  select new.id, k5, (v5->>'completed_sim_seconds')::numeric
  from jsonb_each(s->'objectives') as e(k5, v5) where v5->>'status' = 'completed';

  return new;
end;
$$;

drop trigger if exists saves_project on public.saves;
create trigger saves_project after insert or update on public.saves
for each row execute function public.project_save();

-- ---------------------------------------------------------------------------
-- Row-level security: players see and change only their own rows.
alter table public.saves enable row level security;
create policy "saves are private" on public.saves
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
declare t text;
begin
  foreach t in array array['empires','ships','fleet_assignments','voyages','contracts','cargo','port_development','territories','technologies','diplomacy','achievements']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s readable by owner" on public.%I for select to authenticated using (exists (select 1 from public.saves s where s.id = %I.save_id and s.user_id = auth.uid()))', t, t, t);
  end loop;
end $$;

alter table public.historical_scenarios enable row level security;
alter table public.historical_events enable row level security;
alter table public.historical_sources enable row level security;
create policy "reference data is public" on public.historical_scenarios for select using (true);
create policy "reference events are public" on public.historical_events for select using (true);
create policy "reference sources are public" on public.historical_sources for select using (true);
