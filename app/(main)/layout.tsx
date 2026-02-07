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
    <div className="min-h-screen bg-[#d9d9d9]">
      <header className="border-b border-black/10 bg-[#d9d9d9]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {user && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/40 text-sm font-mono hover:bg-black/5 transition-colors"
              >
                <span className="text-base leading-none">+</span>
                create
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-6 px-8 py-2 rounded-full bg-white text-sm font-mono text-foreground/80">
              <Link href="/explore" className="hover:text-foreground">
                explore
              </Link>
              <Link href="/explore?view=expanded" className="hover:text-foreground">
                expand
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form action="/explore" className="relative">
              <input
                type="search"
                name="q"
                placeholder="search"
                className="w-56 sm:w-64 rounded-full bg-white px-4 py-2 text-sm font-mono text-foreground placeholder:text-foreground/50 border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60">
                ⌕
              </span>
            </form>

            {user ? (
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm font-mono text-foreground/70 hover:text-foreground"
                >
                  sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full border border-black/40 text-sm font-mono hover:bg-black/5 transition-colors"
              >
                sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
