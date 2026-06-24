-- ============================================================
--  VISTORIA ACONTECE — Schema inicial (Supabase / PostgreSQL)
--  Uso interno Acontece Assessoria e Planejamento Imobiliário
--  Cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type papel_usuario as enum ('admin', 'comercial', 'vistoriador');
create type estado_conservacao as enum ('Novo','Ótimo','Bom','Regular','Ruim','Péssimo');
create type situacao_vistoria as enum ('Nova','Em andamento','Concluída','Contestada','Cancelada');
create type situacao_contestacao as enum ('Sem contestação','Pendente','Contestada','Revisada','Não contestada');
create type responsavel_divergencia as enum ('Locatário','Proprietário','Ambos');
create type tipo_agenda as enum ('Agendamento','Pré-agendamento','Indisponibilidade');
create type situacao_agenda as enum ('Agendada','Em andamento','Concluída','Cancelada');

-- ------------------------------------------------------------
-- PERFIS (espelha auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text unique not null,
  papel       papel_usuario not null default 'comercial',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Helper: papel do usuário logado (usado nas policies, SECURITY DEFINER evita recursão de RLS)
create or replace function public.meu_papel()
returns papel_usuario language sql stable security definer set search_path = public as $$
  select papel from public.profiles where id = auth.uid();
$$;

-- Cria profile automaticamente ao registrar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- updated_at automático (reaproveitado por várias tabelas)
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end; $$;

-- ------------------------------------------------------------
-- CADASTROS BÁSICOS
-- ------------------------------------------------------------
create table public.vistoriadores (
  id        uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete set null,
  nome      text not null,
  telefone  text,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.locadores (
  id            uuid primary key default uuid_generate_v4(),
  codigo_externo text,           -- id no Imobiliar
  nome          text not null,
  cpf_cnpj      text,
  email         text,
  telefone      text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.locadores (cpf_cnpj);
create index on public.locadores using gin (to_tsvector('portuguese', nome));

create table public.imoveis (
  id            uuid primary key default uuid_generate_v4(),
  codigo_externo text,           -- id no Imobiliar
  endereco      text not null,
  numero        text,
  complemento   text,
  bairro        text,
  cidade        text default 'Brasília',
  uf            text default 'DF',
  metragem      numeric,
  locador_id    uuid references public.locadores(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.imoveis (codigo_externo);
create index on public.imoveis using gin (to_tsvector('portuguese', endereco));

create table public.tipos_vistoria (
  id                  uuid primary key default uuid_generate_v4(),
  nome                text not null unique,
  usar_como_modelo    boolean not null default true,   -- pode servir de modelo/comparação
  texto_padrao        text,                            -- texto fixo no termo
  somente_contestados boolean not null default false,  -- v4.60: carrega só ambientes contestados
  ativo               boolean not null default true
);

-- Ambientes/itens modelo: aceleram a criação de vistorias no app
create table public.ambientes_modelo (
  id     uuid primary key default uuid_generate_v4(),
  nome   text not null,
  ordem  int not null default 0,
  ativo  boolean not null default true
);
create table public.itens_modelo (
  id                 uuid primary key default uuid_generate_v4(),
  ambiente_modelo_id uuid references public.ambientes_modelo(id) on delete cascade,
  nome               text not null,
  ordem              int not null default 0
);

-- ------------------------------------------------------------
-- AGENDA
-- ------------------------------------------------------------
create table public.agendamentos (
  id              uuid primary key default uuid_generate_v4(),
  tipo            tipo_agenda not null default 'Agendamento',
  imovel_id       uuid references public.imoveis(id) on delete set null,
  tipo_vistoria_id uuid references public.tipos_vistoria(id) on delete set null,
  vistoriador_id  uuid references public.vistoriadores(id) on delete set null, -- null em pré-agendamento
  data_hora       timestamptz not null,
  duracao_min     int default 60,
  situacao        situacao_agenda not null default 'Agendada',
  locatario_nome  text,
  locatario_cpf_cnpj text,
  observacao      text,
  criado_por      uuid references public.profiles(id),
  criado_em       timestamptz not null default now()
);
create index on public.agendamentos (data_hora);
create index on public.agendamentos (vistoriador_id);

-- ------------------------------------------------------------
-- VISTORIA (núcleo) → ambientes → itens → fotos
-- ------------------------------------------------------------
create sequence if not exists vistoria_codigo_seq start 2200000;

create table public.vistorias (
  id                uuid primary key default uuid_generate_v4(),
  codigo            bigint not null default nextval('vistoria_codigo_seq') unique,
  imovel_id         uuid references public.imoveis(id) on delete set null,
  tipo_vistoria_id  uuid references public.tipos_vistoria(id) on delete set null,
  vistoriador_id    uuid references public.vistoriadores(id) on delete set null,
  agendamento_id    uuid references public.agendamentos(id) on delete set null,
  vistoria_modelo_id uuid references public.vistorias(id) on delete set null, -- comparação entrada×saída
  situacao          situacao_vistoria not null default 'Nova',
  contestacao       situacao_contestacao not null default 'Sem contestação',
  prazo_contestacao date,
  data_vistoria     date not null default current_date,
  observacao_interna text,        -- não sai no termo
  tempo_medio_min   int,          -- tempo gasto no app
  criado_por        uuid references public.profiles(id),
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index on public.vistorias (codigo);
create index on public.vistorias (situacao);
create index on public.vistorias (vistoriador_id);
create trigger trg_vistorias_touch before update on public.vistorias
  for each row execute function public.touch_updated_at();

create table public.ambientes (
  id           uuid primary key default uuid_generate_v4(),
  vistoria_id  uuid not null references public.vistorias(id) on delete cascade,
  nome         text not null,
  complemento  text,
  ordem        int not null default 0,
  criado_em    timestamptz not null default now()
);
create index on public.ambientes (vistoria_id);

create table public.itens (
  id            uuid primary key default uuid_generate_v4(),
  ambiente_id   uuid not null references public.ambientes(id) on delete cascade,
  nome          text not null,
  estado        estado_conservacao not null default 'Bom',
  cor_material  text,
  observacao    text,
  ordem         int not null default 0,
  -- divergência (ex-"dano")
  divergencia   boolean not null default false,
  responsavel   responsavel_divergencia,
  valor_estimado numeric,
  criado_em     timestamptz not null default now()
);
create index on public.itens (ambiente_id);
create index on public.itens (divergencia) where divergencia = true;

-- Fotos/vídeos no Storage; aqui guardamos só metadados + caminho
create table public.fotos (
  id          uuid primary key default uuid_generate_v4(),
  vistoria_id uuid not null references public.vistorias(id) on delete cascade,
  ambiente_id uuid references public.ambientes(id) on delete cascade,
  item_id     uuid references public.itens(id) on delete set null,
  storage_path text not null,     -- ex.: vistorias/<id>/<uuid>.jpg
  tipo        text not null default 'foto', -- 'foto' | 'video'
  anotacoes   jsonb,              -- marcações de avaria desenhadas sobre a imagem
  visivel     boolean not null default true, -- não aparece no termo se false
  capturada_em timestamptz,
  lat         numeric, lng numeric,          -- linha do tempo / geolocalização
  ordem       int not null default 0,
  criado_em   timestamptz not null default now()
);
create index on public.fotos (vistoria_id);
create index on public.fotos (item_id);

-- ------------------------------------------------------------
-- CONTESTAÇÃO
-- ------------------------------------------------------------
create table public.contestacoes (
  id              uuid primary key default uuid_generate_v4(),
  vistoria_id     uuid not null references public.vistorias(id) on delete cascade,
  item_id         uuid references public.itens(id) on delete set null,
  contestante_nome text not null,        -- quem contestou (v4.56)
  comentario      text,
  status          text not null default 'pendente', -- pendente|aceita|recusada
  resposta        text,                  -- comentário ao aceitar/recusar
  respondido_por  uuid references public.profiles(id),
  criado_em       timestamptz not null default now()
);
create index on public.contestacoes (vistoria_id);

-- ------------------------------------------------------------
-- ASSINATURAS do termo
-- ------------------------------------------------------------
create table public.assinaturas (
  id           uuid primary key default uuid_generate_v4(),
  vistoria_id  uuid not null references public.vistorias(id) on delete cascade,
  tipo         text not null,            -- Locador|Locatário|Vistoriador|Procurador|Testemunha...
  nome         text not null,
  complemento  text,                     -- ex.: CPF abaixo do nome
  storage_path text,                     -- imagem da assinatura
  assinado_em  timestamptz,
  ordem        int not null default 0
);

-- ============================================================
--  ROW LEVEL SECURITY
--  Regra: admin e comercial veem tudo. Vistoriador vê/edita só
--  o que é dele (próprias vistorias e agendamentos).
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.vistoriadores   enable row level security;
alter table public.locadores       enable row level security;
alter table public.imoveis         enable row level security;
alter table public.tipos_vistoria  enable row level security;
alter table public.ambientes_modelo enable row level security;
alter table public.itens_modelo    enable row level security;
alter table public.agendamentos    enable row level security;
alter table public.vistorias       enable row level security;
alter table public.ambientes       enable row level security;
alter table public.itens           enable row level security;
alter table public.fotos           enable row level security;
alter table public.contestacoes    enable row level security;
alter table public.assinaturas     enable row level security;

-- profiles: cada um lê o próprio; admin lê todos
create policy "profiles_self_read"  on public.profiles for select using (id = auth.uid() or meu_papel() = 'admin');
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid() or meu_papel() = 'admin');
create policy "profiles_admin_insert" on public.profiles for insert with check (meu_papel() = 'admin');

-- Cadastros básicos: todo usuário autenticado lê; admin/comercial escreve
do $$
declare t text;
begin
  foreach t in array array['vistoriadores','locadores','imoveis','tipos_vistoria','ambientes_modelo','itens_modelo']
  loop
    execute format('create policy %I on public.%I for select using (auth.role() = ''authenticated'');', t||'_read', t);
    execute format('create policy %I on public.%I for all using (meu_papel() in (''admin'',''comercial'')) with check (meu_papel() in (''admin'',''comercial''));', t||'_write', t);
  end loop;
end $$;

-- Agendamentos: admin/comercial tudo; vistoriador só os seus
create policy "agenda_read" on public.agendamentos for select using (
  meu_papel() in ('admin','comercial')
  or vistoriador_id in (select id from public.vistoriadores where profile_id = auth.uid())
);
create policy "agenda_write_office" on public.agendamentos for all
  using (meu_papel() in ('admin','comercial')) with check (meu_papel() in ('admin','comercial'));

-- Função: a vistoria pertence ao usuário logado?
create or replace function public.minha_vistoria(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.vistorias vi
    join public.vistoriadores vt on vt.id = vi.vistoriador_id
    where vi.id = v and vt.profile_id = auth.uid()
  );
$$;

-- Vistorias
create policy "vistorias_read" on public.vistorias for select using (
  meu_papel() in ('admin','comercial') or minha_vistoria(id)
);
create policy "vistorias_insert" on public.vistorias for insert with check (auth.role() = 'authenticated');
create policy "vistorias_update" on public.vistorias for update using (
  meu_papel() in ('admin','comercial') or minha_vistoria(id)
);
create policy "vistorias_delete" on public.vistorias for delete using (meu_papel() in ('admin','comercial'));

-- Tabelas-filhas (ambientes, itens, fotos, contestacoes, assinaturas):
-- herda o acesso da vistoria-pai
do $$
declare t text;
begin
  foreach t in array array['ambientes','itens','fotos','contestacoes','assinaturas']
  loop
    if t in ('ambientes','fotos','contestacoes','assinaturas') then
      execute format($f$create policy %I on public.%I for all
        using (meu_papel() in ('admin','comercial') or minha_vistoria(vistoria_id))
        with check (meu_papel() in ('admin','comercial') or minha_vistoria(vistoria_id));$f$, t||'_all', t);
    end if;
  end loop;
end $$;

-- itens liga-se à vistoria via ambiente → policy própria
create policy "itens_all" on public.itens for all using (
  meu_papel() in ('admin','comercial')
  or minha_vistoria((select vistoria_id from public.ambientes where id = ambiente_id))
) with check (
  meu_papel() in ('admin','comercial')
  or minha_vistoria((select vistoria_id from public.ambientes where id = ambiente_id))
);

-- ============================================================
--  STORAGE: bucket privado para mídias da vistoria
-- ============================================================
insert into storage.buckets (id, name, public) values ('vistorias','vistorias', false)
on conflict (id) do nothing;

create policy "midias_read" on storage.objects for select
  using (bucket_id = 'vistorias' and auth.role() = 'authenticated');
create policy "midias_write" on storage.objects for insert
  with check (bucket_id = 'vistorias' and auth.role() = 'authenticated');
create policy "midias_update" on storage.objects for update
  using (bucket_id = 'vistorias' and auth.role() = 'authenticated');
create policy "midias_delete" on storage.objects for delete
  using (bucket_id = 'vistorias' and meu_papel() in ('admin','comercial'));

-- ============================================================
--  SEED — dados reais de cadastro da Acontece
-- ============================================================
insert into public.tipos_vistoria (nome) values
  ('Captação Avaliação'),('Entrada'),('Entrada (Aditivo na Vistoria)'),
  ('Faxina (Limpeza)'),('FERIADO/FERIAS/ CONSULTAS'),('Fotos/Atualizar fotos'),
  ('Manutenção/Reparos'),('Pós-Manutenção'),('Reforma'),('Saída')
on conflict (nome) do nothing;

insert into public.ambientes_modelo (nome, ordem) values
  ('Sala',1),('Cozinha',2),('Quarto',3),('Suíte',4),('Banheiro',5),
  ('Área de serviço',6),('Varanda',7),('Garagem',8),('Hall/Entrada',9)
on conflict do nothing;

-- Itens-padrão para o ambiente "Sala"
insert into public.itens_modelo (ambiente_modelo_id, nome, ordem)
select id, x.nome, x.ordem from public.ambientes_modelo,
  (values ('Piso',1),('Parede',2),('Teto',3),('Porta',4),
          ('Janela',5),('Tomadas / Interruptores',6),('Iluminação',7)) as x(nome, ordem)
where nome = 'Sala';
