import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Artfolio
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Explore
            </Link>
            {user && (
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
            )}
            {user && (
              <Link
                href="/upload"
                className="flex items-center gap-1 px-4 py-1.5 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <span>+</span> New
              </Link>
            )}
            {user ? (
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
