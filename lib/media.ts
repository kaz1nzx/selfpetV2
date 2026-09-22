import type { SupabaseClient } from "@supabase/supabase-js";

export async function signedMediaUrl(supabase: SupabaseClient, path?: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("selfpet-media").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
