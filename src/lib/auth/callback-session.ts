import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AuthCallbackParams = {
  code: string | null;
  token_hash: string | null;
  type: string | null;
};

export async function establishSessionFromCallbackParams(
  supabase: SupabaseClient<Database>,
  params: AuthCallbackParams,
): Promise<{ ok: boolean; errorMessage: string | null }> {
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (!error) {
      return { ok: true, errorMessage: null };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return { ok: true, errorMessage: null };
    }

    return { ok: false, errorMessage: error.message };
  }

  if (params.token_hash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    });
    if (!error) {
      return { ok: true, errorMessage: null };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return { ok: true, errorMessage: null };
    }

    return { ok: false, errorMessage: error.message };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return { ok: true, errorMessage: null };
  }

  return { ok: false, errorMessage: "missing_params" };
}
