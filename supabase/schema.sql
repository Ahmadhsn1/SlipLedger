begin;
create schema if not exists fieldtab_private;
revoke all on schema fieldtab_private from public;
grant usage on schema fieldtab_private to authenticated;
create or replace function fieldtab_private.active_account() returns boolean
language sql stable security definer set search_path = ''
as $$select exists(select 1 from auth.users where id = auth.uid())$$;
revoke all on function fieldtab_private.active_account() from public;
grant execute on function fieldtab_private.active_account() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('workspaces','workspaces',false,25165824,array['application/zip'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "read own backup" on storage.objects for select to authenticated
using((select fieldtab_private.active_account()) and bucket_id='workspaces' and name=(select auth.uid())::text||'/backup.zip');
create policy "create own backup" on storage.objects for insert to authenticated
with check((select fieldtab_private.active_account()) and bucket_id='workspaces' and name=(select auth.uid())::text||'/backup.zip');
create policy "replace own backup" on storage.objects for update to authenticated
using((select fieldtab_private.active_account()) and bucket_id='workspaces' and name=(select auth.uid())::text||'/backup.zip')
with check((select fieldtab_private.active_account()) and bucket_id='workspaces' and name=(select auth.uid())::text||'/backup.zip');
commit;
