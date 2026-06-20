import { mapAuthError } from "@/lib/auth/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type DeleteBody = {
  password?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Morate biti prijavljeni." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const password = body.password?.trim();

  if (password) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (verifyError) {
      return NextResponse.json(
        { error: "Pogrešna lozinka." },
        { status: 401 },
      );
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Brisanje naloga nije konfigurisano (SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503 },
    );
  }

  const { error: profileError } = await admin
    .from("korisnik")
    .delete()
    .eq("user_uuid", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: mapAuthError(profileError.message) },
      { status: 500 },
    );
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return NextResponse.json(
      { error: mapAuthError(authError.message) },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
