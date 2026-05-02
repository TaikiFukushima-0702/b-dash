-- B-Dash: 読書記録アプリ 初期スキーマ
-- 単一ユーザー想定: RLS で auth.uid() を全行に enforce

create extension if not exists pg_trgm;

-- 読書ステータス
create type book_status as enum ('to_read', 'reading', 'finished', 'dnf');

-- 蔵書テーブル
create table books (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  isbn          text,
  title         text not null,
  authors       text[] not null default '{}',
  publisher     text,
  published_at  date,
  cover_url     text,
  total_pages   int,
  current_page  int not null default 0,
  status        book_status not null default 'to_read',
  rating        int check (rating between 1 and 5),
  started_at    timestamptz,
  finished_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index books_user_idx on books(user_id);
create index books_status_idx on books(user_id, status);
create index books_isbn_idx on books(user_id, isbn);

-- ハイライト・引用メモ
create table highlights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     uuid not null references books(id) on delete cascade,
  page        int,
  text        text not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index highlights_book_idx on highlights(book_id);
create index highlights_user_idx on highlights(user_id);

-- 読書セッション(時間トラッキング)
create table reading_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         uuid not null references books(id) on delete cascade,
  started_at      timestamptz not null,
  ended_at        timestamptz,
  duration_min    int generated always as (
                    case when ended_at is not null
                         then (extract(epoch from (ended_at - started_at)) / 60)::int
                    end
                  ) stored,
  pages_read      int default 0,
  created_at      timestamptz not null default now()
);

create index sessions_book_idx on reading_sessions(book_id);
create index sessions_user_idx on reading_sessions(user_id, started_at desc);

-- タグ
create table tags (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  name      text not null,
  unique(user_id, name)
);

create table book_tags (
  book_id  uuid references books(id) on delete cascade,
  tag_id   uuid references tags(id) on delete cascade,
  primary key (book_id, tag_id)
);

create index book_tags_tag_idx on book_tags(tag_id);

-- 全文検索: 日本語は simple + trigram で部分一致
alter table books     add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(authors, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(notes, '')), 'C')
  ) stored;

alter table highlights add column search_tsv tsvector
  generated always as (
    to_tsvector('simple', coalesce(text, '') || ' ' || coalesce(note, ''))
  ) stored;

create index books_search_idx      on books using gin(search_tsv);
create index books_title_trgm_idx  on books using gin(title gin_trgm_ops);
create index books_notes_trgm_idx  on books using gin(notes gin_trgm_ops);
create index highlights_search_idx on highlights using gin(search_tsv);
create index highlights_text_trgm  on highlights using gin(text gin_trgm_ops);

-- updated_at 自動更新
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger books_updated_at before update on books
  for each row execute function set_updated_at();

-- RLS: 全テーブル
alter table books             enable row level security;
alter table highlights        enable row level security;
alter table reading_sessions  enable row level security;
alter table tags              enable row level security;
alter table book_tags         enable row level security;

create policy "own books"        on books            for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own highlights"   on highlights       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own sessions"     on reading_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tags"         on tags             for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own book_tags"    on book_tags        for all
  using (exists (select 1 from books b where b.id = book_id and b.user_id = auth.uid()))
  with check (exists (select 1 from books b where b.id = book_id and b.user_id = auth.uid()));
