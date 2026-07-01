-- 본인 프로필 사진만 수정 허용.
-- members는 사장만 쓰기(members_owner_write)라 공주/스탭이 본인 사진도 못 바꿨음
-- (updateMember의 .single()이 0행 → "Cannot coerce the result to a single JSON object").
-- RLS를 통째로 열면 본인이 type을 바꿔 권한상승할 수 있으므로, 사진 컬럼만 바꾸는 함수로 우회.
create or replace function set_my_photo(p_url text)
returns text
language sql
security definer
set search_path = public
as $$
  update members set profile_photo_url = p_url
  where id = current_member_id()
  returning profile_photo_url;
$$;

grant execute on function set_my_photo(text) to authenticated;
