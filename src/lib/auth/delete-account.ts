import { mapAuthError } from "@/lib/auth/messages";

export async function requestAccountDeletionEmail(): Promise<{
  error?: string;
  success?: string;
}> {
  const response = await fetch("/api/account/delete-request", { method: "POST" });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      error:
        body?.error ??
        "Slanje linka nije uspjelo. Pokušajte potvrdu lozinkom ili kasnije.",
    };
  }

  return {
    success:
      "Poslali smo link za potvrdu brisanja na vaš email. Link važi ograničeno vrijeme — provjerite inbox i spam.",
  };
}

export async function deleteAccountWithPassword(password: string): Promise<{
  error?: string;
}> {
  const response = await fetch("/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      error:
        body?.error ??
        "Brisanje naloga nije uspjelo. Pokušajte ponovo kasnije.",
    };
  }

  return {};
}

export async function deleteAccountConfirmed(): Promise<{
  error?: string;
}> {
  const response = await fetch("/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      error:
        body?.error ??
        "Brisanje naloga nije uspjelo. Pokušajte ponovo kasnije.",
    };
  }

  return {};
}

export async function signOutAfterDelete(): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  await supabase.auth.signOut();
}
