/**
 * Simple Header Component
 *
 * Minimal header with page title and user avatar.
 * Server Component that fetches user data.
 * Used for initial deployment - replaces sidebar/breadcrumb navigation.
 */

import { PageTitle } from "@/components/layout/page-title";
import { UserAvatar } from "@/components/layout/user-avatar";
import { createClient } from "@/lib/supabase/server";

export async function SimpleHeader() {
  const supabase = await createClient();

  // Fetch authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Default values
  let email = "user@example.com";
  let firstName: string | undefined;
  let lastName: string | undefined;

  // Fetch profile data if user is authenticated
  if (user) {
    email = user.email || email;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      firstName = profile.first_name || undefined;
      lastName = profile.last_name || undefined;
    }
  }

  const hasFullName = firstName && lastName;

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-zinc-950">
      <div className="container flex items-center justify-between py-4">
        <PageTitle />
        <div className="flex items-center gap-3">
          {hasFullName && (
            <div className="hidden flex-col items-end md:flex">
              <p className="font-medium text-foreground text-sm leading-tight">
                {firstName} {lastName}
              </p>
              <p className="text-muted-foreground text-xs leading-tight">
                {email}
              </p>
            </div>
          )}
          <UserAvatar email={email} firstName={firstName} lastName={lastName} />
        </div>
      </div>
    </header>
  );
}
