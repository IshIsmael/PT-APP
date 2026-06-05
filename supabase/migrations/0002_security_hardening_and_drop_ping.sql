-- Drop the temporary Phase 0 round-trip table (and its permissive anon policies).
drop table if exists public.ping;

-- Pin search_path on the trigger helper (linter 0011_function_search_path_mutable).
-- now() lives in pg_catalog so it still resolves under an empty search_path.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- These are trigger functions — they must not be invokable via the public REST RPC
-- API (linters 0028/0029). Triggers still fire regardless of EXECUTE grants.
revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
