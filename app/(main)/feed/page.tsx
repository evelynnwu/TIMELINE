import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkCard } from "@/components/work-card";
import { EmptyState } from "@/components/empty-state";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get list of users the current user follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = new Set(following?.map((f) => f.following_id) || []);

  // Fetch recent works with author profiles
  const { data: works, error: worksError } = await supabase
    .from("works")
    .select(
      `
      *,
      author:profiles!works_author_id_fkey(id, username, display_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (worksError) {
    console.error("Error fetching works:", worksError);
  }

  // Sort works: followed users first, then by date
  const sortedWorks = works?.sort((a, b) => {
    const aFollowed = followingIds.has(a.author_id);
    const bFollowed = followingIds.has(b.author_id);

    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;

    // Both followed or both not followed: sort by date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
      </div>

      {sortedWorks && sortedWorks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWorks.map((work) => {
            const isFollowed = followingIds.has(work.author_id);
            return (
              <WorkCard
                key={work.id}
                work={work}
                author={work.author}
                isFollowed={isFollowed}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          message="No artwork yet. Be the first to share!"
          action={{ label: "Upload Your First Artwork", href: "/upload" }}
        />
      )}
    </div>
  );
}
