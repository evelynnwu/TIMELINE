import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ThreadLeftSidebar from "@/app/components/thread-left-sidebar";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

type Work = {
  id: string;
  title: string | null;
  work_type: string | null;
  image_url: string | null;
  created_at: string;
  primary_thread?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  author?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function ProfilePage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "saved" ? "saved" : "works";

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
    .select(`
      *,
      primary_thread:threads!works_primary_thread_id_fkey(id, name, description)
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch bookmarked works with author info
  const { data: bookmarkedWorks } = await supabase
    .from("bookmarks")
    .select(
      `
      work_id,
      created_at,
      work:works(
        id,
        title,
        work_type,
        image_url,
        created_at,
        author:profiles!works_author_id_fkey(id, username, display_name, avatar_url),
        primary_thread:threads!works_primary_thread_id_fkey(id, name, description)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Extract works from bookmarks
  const savedWorks = bookmarkedWorks
    ?.map((b) => b.work as unknown as Work | null)
    .filter((w): w is Work => w !== null);

  // Get follower/following counts
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);

  const { data: threads } = user
    ? await supabase
        .from("user_threads")
        .select("thread:threads(id, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] as { thread: { id: string; name: string | null } | null }[] };

  const displayWorks = activeTab === "saved" ? savedWorks : works;
  const postsCount = works?.length || 0;
  const displayName = profile?.display_name || "Anonymous Artist";
  const avatarInitial = (profile?.display_name || user.email || "A")[0]?.toUpperCase();
  const threadItems =
    threads
      ?.map((item) => item.thread)
      .filter(
        (thread): thread is { id: string; name: string | null } =>
          Boolean(thread)
      ) || [];

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <ThreadLeftSidebar
        profile={profile}
        threads={threadItems}
        footer={
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 rounded-full bg-[#bcbcbc] px-4 py-2 text-xs shadow-sm"
          >
            <span>⚙</span>
            <span>Settings</span>
          </Link>
        }
      />
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="h-28 w-28 rounded-full bg-[#d9d9d9] flex items-center justify-center text-4xl text-black/70">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                avatarInitial
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-3xl">{displayName}</h1>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#dcdcdc] px-4 py-1.5 text-xs shadow-sm"
                >
                  <span className="text-xs">✎</span>
                  <span>Edit profile</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-black/70">
                {profile?.username && <span>@{profile.username}</span>}
                <span>•</span>
                <span>{postsCount} posts</span>
                <span>{followersCount || 0} followers</span>
                <span>{followingCount || 0} following</span>
              </div>

              {profile?.bio && <p className="text-sm text-black/80">{profile.bio}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-black/60">
                {profile?.location && <span>{profile.location}</span>}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black"
                  >
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-10 text-sm">
            <Link
              href="/profile"
              className={`border-b pb-1 ${
                activeTab === "works" ? "border-black" : "border-transparent text-black/60"
              }`}
            >
              timeline
            </Link>
            <Link
              href="/profile?tab=saved"
              className={`border-b pb-1 ${
                activeTab === "saved" ? "border-black" : "border-transparent text-black/60"
              }`}
            >
              saved
            </Link>
          </div>

          <div className="mt-8 rounded-[32px] bg-[#d9d9d9] p-6">
            {displayWorks && displayWorks.length > 0 ? (
              activeTab === "works" ? (
                /* Timeline view for works */
                <div className="relative pl-8">
                  {/* Vertical timeline line with gradient fading */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-black/30 to-transparent" />

                  {/* Timeline items */}
                  <div className="space-y-8">
                    {displayWorks.map((work, index) => {
                      const isFirst = index === 0;
                      const isLast = index === displayWorks.length - 1;

                      return (
                        <div key={work.id} className="relative flex items-start gap-4">
                          {/* Timeline dot */}
                          <div className="absolute -left-8 top-4 w-3 h-3 rounded-full bg-black/70 border-2 border-[#d9d9d9]" />

                          {/* Work card */}
                          <Link
                            href={`/work/${work.id}`}
                            className="flex-1 flex gap-4 p-4 bg-white rounded-2xl border border-black/10 hover:shadow-md transition-all group"
                          >
                            {/* Thumbnail */}
                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/5">
                              {work.image_url ? (
                                <img
                                  src={work.image_url}
                                  alt={work.title || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-black/40">Essay</span>
                                </div>
                              )}
                            </div>

                            {/* Work info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-base truncate group-hover:text-black/80">
                                {work.title}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 text-xs text-black/60">
                                {work.primary_thread?.name && (
                                  <span className="px-2 py-0.5 bg-black/5 rounded-full">
                                    {work.primary_thread.name}
                                  </span>
                                )}
                                <span>
                                  {new Date(work.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Grid view for saved works */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayWorks.map((work) => (
                    <Link
                      key={work.id}
                      href={`/work/${work.id}`}
                      className="aspect-square relative rounded-2xl overflow-hidden border border-black/10 group bg-white"
                    >
                      {work.image_url && (
                        <img
                          src={work.image_url}
                          alt={work.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      {work.work_type === "essay" && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
                          Essay
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {work.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12 text-sm text-black/60">
                {activeTab === "saved" ? (
                  <p>You haven&apos;t saved any works yet.</p>
                ) : (
                  <>
                    <p className="mb-4">You haven&apos;t created any works yet.</p>
                    <Link
                      href="/upload"
                      className="inline-block rounded-full bg-[#cfcfcf] px-6 py-2 text-sm"
                    >
                      Create Your First Work
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
    </div>
  );
}
