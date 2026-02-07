import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "./delete-button";
import { BookmarkButton } from "./bookmark-button";
import { CommentsSection } from "./comments-section";
import { Avatar } from "@/components/avatar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user (may be null)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the work with author
  const { data: work, error } = await supabase
    .from("works")
    .select(
      `
      *,
      author:profiles!works_author_id_fkey(id, username, display_name, avatar_url)
    `
    )
    .eq("id", id)
    .single();

  if (error || !work) {
    notFound();
  }

  const isOwner = user?.id === work.author_id;

  // Check if user has bookmarked this work
  let isBookmarked = false;
  if (user) {
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("work_id", id)
      .maybeSingle();

    isBookmarked = !!bookmark;
  }

  // Fetch comments with author data (only if user is logged in)
  let comments: Array<{
    id: string;
    body: string;
    created_at: string;
    author_id: string;
    author: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    };
  }> = [];

  if (user) {
    const { data: commentsData } = await supabase
      .from("work_comments")
      .select(
        `
        id,
        body,
        created_at,
        author_id,
        author:profiles!work_comments_author_id_fkey(id, username, display_name, avatar_url)
      `
      )
      .eq("work_id", id)
      .order("created_at", { ascending: false });

    if (commentsData) {
      // Transform data - Supabase returns author as array
      comments = commentsData.map((comment) => ({
        ...comment,
        author: Array.isArray(comment.author) ? comment.author[0] : comment.author,
      }));
    }
  }

  // Format date
  const publishedDate = new Date(work.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate reading time for essays (rough estimate: 200 words per minute)
  const readingTime =
    work.work_type === "essay" && work.content
      ? Math.max(1, Math.ceil(work.content.split(/\s+/).length / 200))
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Cover image */}
      {work.image_url && (
        <div className="mb-8">
          <img
            src={work.image_url}
            alt={work.title}
            className={`w-full rounded-lg ${
              work.work_type === "essay" ? "max-h-80 object-cover" : ""
            }`}
          />
        </div>
      )}

      {/* Title and meta */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            {work.work_type === "essay" && (
              <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded mb-3">
                Essay
              </span>
            )}
            <h1 className="text-3xl font-bold mb-4">{work.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && <BookmarkButton workId={work.id} isBookmarked={isBookmarked} />}
            {isOwner && <DeleteButton workId={work.id} />}
          </div>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-3">
          <Link
            href={work.author?.username ? `/${work.author.username}` : "#"}
            className="flex items-center gap-3 group"
          >
            <Avatar
              src={work.author?.avatar_url}
              alt={work.author?.display_name || "Author"}
              fallback={work.author?.display_name || "?"}
              size="md"
            />
            <div>
              <p className="font-medium group-hover:underline">
                {work.author?.display_name || "Anonymous"}
              </p>
              <p className="text-sm text-muted-foreground">
                {publishedDate}
                {readingTime && ` · ${readingTime} min read`}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Description for images */}
      {work.work_type === "image" && work.description && (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground">{work.description}</p>
        </div>
      )}

      {/* Essay content */}
      {work.work_type === "essay" && work.content && (
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {work.content.split("\n\n").map((paragraph: string, i: number) => (
            <p key={i} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </article>
      )}

      {/* Comments section (only for logged-in users) */}
      {user && (
        <CommentsSection
          workId={work.id}
          currentUserId={user.id}
          initialComments={comments}
        />
      )}

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-border">
        <Link
          href="/feed"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Feed
        </Link>
      </div>
    </div>
  );
}
