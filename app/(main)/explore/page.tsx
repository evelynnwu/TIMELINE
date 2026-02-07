import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExploreFeed from "./explore-feed";

export default async function ExplorePage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current user's profile (also fetched in Header)
  const { data: currentProfile } = user
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", user.id)
        .single()
    : { data: null };

  // Get list of users the current user follows
  const { data: followingData } = user
    ? await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
    : { data: null };

  const followingIds = new Set(followingData?.map((f) => f.following_id) || []);

  const { data: works } = await supabase
    .from("works")
    .select(
      `
      id,
      title,
      description,
      image_url,
      work_type,
      content,
      created_at,
      author_id,
      author:profiles!works_author_id_fkey(id, username, display_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Sort works: followed users first, then by date
  const sortedWorks = works?.sort((a, b) => {
    const aFollowed = followingIds.has(a.author_id);
    const bFollowed = followingIds.has(b.author_id);

    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const { data: creatives } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: threads } = await supabase
    .from("threads")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: following } = user
    ? await supabase
        .from("follows")
        .select(
          "following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url)"
        )
        .eq("follower_id", user.id)
        .limit(6)
    : { data: [] as { following: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null }[] };

  const displayName =
    currentProfile?.display_name || currentProfile?.username || "guest";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const threadItems =
    threads
      ?.map((thread) => ({
        id: thread.id,
        name: thread.name?.trim() || null,
      }))
      .filter((thread) => thread.name) || [];

  // Normalize author and primary_interest fields - Supabase can return single object or array
  const workItems = (sortedWorks || []).map((work) => ({
    ...work,
    author: Array.isArray(work.author) ? work.author[0] : work.author,
    primary_interest: Array.isArray(work.primary_interest) ? work.primary_interest[0] : work.primary_interest,
  }));
  const creativeItems = creatives || [];
  const followingItems =
    following
      ?.map((item) => {
        const f = item.following;
        return Array.isArray(f) ? f[0] : f;
      })
      .filter(
        (profile): profile is { id: string; username: string | null; display_name: string | null; avatar_url: string | null } =>
          profile !== null && profile !== undefined
      ) || [];

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
          <aside className="hidden lg:flex lg:flex-col lg:gap-6">
            <div className="rounded-2xl bg-[#d9d9d9] p-4 shadow-sm">
              <div className="relative overflow-hidden rounded-2xl bg-[#f2f2f2]">
                <div className="h-28 bg-white" />
                <div className="h-32 bg-[#9a9a9a]" />
                <div className="absolute left-1/2 top-20 -translate-x-1/2">
                  {currentProfile?.avatar_url ? (
                    <img
                      src={currentProfile.avatar_url}
                      alt={displayName}
                      className="h-24 w-24 rounded-full border-4 border-[#f2f2f2] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full border-4 border-[#f2f2f2] bg-[#d8d8d8] flex items-center justify-center text-3xl text-black/70">
                      {avatarLetter}
                    </div>
                  )}
                </div>
                <div className="flex justify-center pb-6 pt-10">
                  {currentProfile?.username ? (
                    <Link
                      href={`/${currentProfile.username}`}
                      className="rounded-full bg-[#dcdcdc] px-8 py-2 text-sm shadow-sm hover:bg-[#d0d0d0] transition-colors"
                    >
                      portfolio
                    </Link>
                  ) : (
                    <span className="rounded-full bg-[#dcdcdc] px-8 py-2 text-sm shadow-sm">
                      portfolio
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-black/70">following</p>
              {followingItems.length > 0 ? (
                <ul className="space-y-2">
                  {followingItems.map((profile) => (
                    <li key={profile.id}>
                      <Link
                        href={profile.username ? `/${profile.username}` : "#"}
                        className="hover:text-black/80 transition-colors"
                      >
                        {profile.username ? `@${profile.username}` : profile.display_name || "unknown"}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-black/50">no follows yet</p>
              )}
            </div>

            <div className="mt-auto flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3a8d3a] text-white shadow-md">
                {avatarLetter}
              </div>
            </div>
          </aside>

          <section className="space-y-8">
            {workItems.length > 0 ? (
              workItems.map((work) => {
                const author = work.author;
                const authorName =
                  author?.display_name ||
                  (author?.username ? `@${author.username}` : "anonymous");
                const authorInitial = authorName.charAt(0).toUpperCase();
                const isFollowed = followingIds.has(work.author_id);

                return (
                  <article key={work.id} className="overflow-hidden rounded-xl bg-white shadow-md">
                    <Link href={`/work/${work.id}`} className="block">
                      {work.image_url ? (
                        <img
                          src={work.image_url}
                          alt={work.title || "Artwork"}
                          className="h-80 w-full object-cover hover:opacity-95 transition-opacity"
                        />
                      ) : (
                        <div className="p-6 text-sm text-black/70 hover:bg-black/5 transition-colors">
                          <p className="text-base text-black/80">
                            {work.title || "Untitled"}
                          </p>
                          {work.description && (
                            <p className="mt-2 text-black/60">
                              {work.description}
                            </p>
                          )}
                          {work.work_type === "essay" && work.content && (
                            <p className="mt-2 line-clamp-3 text-black/50">
                              {work.content}
                            </p>
                          )}
                        </div>
                      )}
                    </Link>
                    <div className="flex items-center justify-between border-t border-black/10 p-4 text-sm">
                      <Link
                        href={author?.username ? `/${author.username}` : "#"}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        {author?.avatar_url ? (
                          <img
                            src={author.avatar_url}
                            alt={authorName}
                            className="h-10 w-10 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#e6e6e6] flex items-center justify-center">
                            {authorInitial}
                          </div>
                        )}
                        <div>
                          <p className="text-black/80">{authorName}</p>
                          {work.title && work.image_url && (
                            <p className="text-black/60">{work.title}</p>
                          )}
                        </div>
                      </Link>
                      {isFollowed && (
                        <span className="text-xs text-black/50 bg-black/5 px-2 py-1 rounded-full">
                          Following
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-xl bg-white p-6 shadow-md text-sm text-black/60">
                No works yet.{" "}
                <Link href="/upload" className="underline hover:text-black">
                  Be the first to share!
                </Link>
              </article>
            )}
          </section>

          <aside className="hidden lg:flex lg:flex-col lg:gap-10">
            <div className="space-y-4">
              <p className="text-sm text-black/70">threads for you</p>
              {threadItems.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {threadItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-md bg-[#d0d0d0]" />
                      <Link
                        href={`/threads/${item.id}`}
                        className="hover:text-black/80 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-black/50">no threads yet</p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-black/70">creatives for you</p>
              {creativeItems.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {creativeItems.map((item) => {
                    const label =
                      item.display_name ||
                      (item.username ? `@${item.username}` : "unknown");
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.username ? `/${item.username}` : "#"}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          {item.avatar_url ? (
                            <img
                              src={item.avatar_url}
                              alt={label}
                              className="h-8 w-8 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="h-8 w-8 rounded-full bg-[#d0d0d0] flex items-center justify-center text-xs">
                              {label.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span>{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-black/50">no creatives yet</p>
              )}
            </div>
          </aside>
    </div>
  );
}
