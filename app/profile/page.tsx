import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch the user's works
  const { data: works } = await supabase
    .from("works")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Artfolio
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/feed"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Feed
            </Link>
            <Link
              href="/profile"
              className="text-sm text-foreground font-medium"
            >
              Profile
            </Link>
            <Link
              href="/upload"
              className="px-4 py-1.5 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Upload
            </Link>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-6 mb-8">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || "Avatar"}
              className="w-24 h-24 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground">
                {(profile?.display_name || user.email)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {profile?.display_name || "Anonymous Artist"}
            </h1>
            {profile?.username && (
              <p className="text-muted-foreground">@{profile.username}</p>
            )}
            {profile?.bio && <p className="mt-2">{profile.bio}</p>}

            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              {profile?.location && <span>{profile.location}</span>}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {profile.website}
                </a>
              )}
            </div>
          </div>

          <Link
            href="/profile/edit"
            className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Your Works {works && works.length > 0 && `(${works.length})`}
            </h2>
          </div>

          {works && works.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {works.map((work) => (
                <div
                  key={work.id}
                  className="aspect-square relative rounded-lg overflow-hidden border border-border group"
                >
                  <img
                    src={work.image_url}
                    alt={work.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {work.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven't uploaded any works yet.
              </p>
              <Link
                href="/upload"
                className="inline-block px-6 py-2 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Upload Your First Artwork
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
