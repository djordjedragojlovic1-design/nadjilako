import { mapAuthError } from "@/lib/auth/messages";
import { getSiteOrigin } from "@/lib/auth/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
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

  if (!createAdminClient()) {
    return NextResponse.json(
      {
        error:
          "Brisanje naloga nije konfigurisano (SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503 },
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const origin = getSiteOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/obrisi-nalog")}`;

  const otpResponse = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      create_user: false,
      options: { email_redirect_to: redirectTo },
    }),
  });

  if (!otpResponse.ok) {
    const payload = (await otpResponse.json().catch(() => null)) as {
      msg?: string;
      message?: string;
    } | null;
    const message =
      payload?.msg ?? payload?.message ?? "Slanje emaila nije uspjelo.";
    return NextResponse.json(
      {
        error: `${mapAuthError(message)} Možete odmah obrisati nalog potvrdom lozinke.`,
      },
      { status: otpResponse.status },
    );
  }

  return NextResponse.json({ ok: true });
}
