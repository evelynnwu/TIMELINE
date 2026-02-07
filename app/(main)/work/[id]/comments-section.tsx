"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";

interface Comment {
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
}

interface CommentsSectionProps {
  workId: string;
  currentUserId: string;
  initialComments: Comment[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function CommentsSection({
  workId,
  currentUserId,
  initialComments,
}: CommentsSectionProps) {
  const router = useRouter();
  const supabase = createClient();

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("work_comments")
        .insert({
          work_id: workId,
          author_id: currentUserId,
          body: newComment.trim(),
        })
        .select(
          `
          id,
          body,
          created_at,
          author_id,
          author:profiles!work_comments_author_id_fkey(id, username, display_name, avatar_url)
        `
        )
        .single();

      if (error) throw error;

      // Transform the data - Supabase returns author as array
      const addedComment: Comment = {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
      };

      // Add new comment to the top of the list
      setComments([addedComment, ...comments]);
      setNewComment("");
      router.refresh();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);

    try {
      const { error } = await supabase
        .from("work_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== commentId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-lg font-semibold mb-6">
        Comments ({comments.length})
      </h2>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          maxLength={2000}
          className="w-full px-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/2000
          </span>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar
                src={comment.author?.avatar_url}
                alt={comment.author?.display_name || "User"}
                fallback={comment.author?.display_name || "?"}
                size="sm"
                className="flex-shrink-0"
              />

              {/* Comment content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {comment.author?.display_name || "Anonymous"}
                  </span>
                  {comment.author?.username && (
                    <span className="text-muted-foreground text-sm">
                      @{comment.author.username}
                    </span>
                  )}
                  <span className="text-muted-foreground text-sm">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                  {comment.body}
                </p>

                {/* Delete button (only for own comments) */}
                {comment.author_id === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="text-xs text-muted-foreground hover:text-red-600 mt-2 transition-colors disabled:opacity-50"
                  >
                    {deletingId === comment.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
