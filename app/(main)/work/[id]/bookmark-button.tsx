"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BookmarkButtonProps {
  workId: string;
  isBookmarked: boolean;
}

export function BookmarkButton({
  workId,
  isBookmarked: initialIsBookmarked,
}: BookmarkButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggleBookmark() {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("work_id", workId);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        // Add bookmark
        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          work_id: workId,
        });

        if (error) throw error;
        setIsBookmarked(true);
      }

      router.refresh();
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
        isBookmarked
          ? "text-foreground bg-muted"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this work"}
    >
      {isLoading ? (
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}
    </button>
  );
}
