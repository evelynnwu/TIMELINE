import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "./follow-button";
import { Avatar } from "@/components/avatar";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Get current user (may be null if not logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the profile by username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !profile) {
    notFound();
  }

  // If viewing own profile, redirect to /profile
  if (user && profile.id === user.id) {
    redirect("/profile");
  }

  // Fetch the user's works
  const { data: works } = await supabase
    .from("works")
    .select(`
      *,
      primary_thread:threads!works_primary_thread_id_fkey(id, name, description)
    `)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  // Check if current user is following this profile
  let isFollowing = false;
  if (user) {
    const { data: follow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();

    isFollowing = !!follow;
  }

  // Get follower/following counts
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start gap-6 mb-8">
        <Avatar
          src={profile.avatar_url}
          alt={profile.display_name || "Avatar"}
          fallback={profile.display_name || "?"}
          size="xl"
        />

        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {profile.display_name || "Anonymous Artist"}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-2">{profile.bio}</p>}

          <div className="flex gap-4 mt-3 text-sm">
            <span>
              <strong>{followersCount || 0}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </span>
            <span>
              <strong>{followingCount || 0}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </div>

          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            {profile.location && <span>{profile.location}</span>}
            {profile.website && (
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

        {user && (
          <FollowButton
            profileId={profile.id}
            isFollowing={isFollowing}
          />
        )}
      </div>

      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold mb-4">
          Works {works && works.length > 0 && `(${works.length})`}
        </h2>

        {works && works.length > 0 ? (
          <div className="relative pl-8">
            {/* Vertical timeline line with gradient fading */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-black/30 to-transparent" />

            {/* Timeline items */}
            <div className="space-y-8">
              {works.map((work) => (
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
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No works yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
