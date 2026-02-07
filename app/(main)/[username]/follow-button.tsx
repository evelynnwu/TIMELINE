"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "../explore/actions";

interface FollowButtonProps {
  profileId: string;
  isFollowing: boolean;
}

export function FollowButton({ profileId, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  function handleToggleFollow() {
    startTransition(() => {
      void (async () => {
        const result = await toggleFollow(profileId);

        if (result.success) {
          setIsFollowing(result.isFollowing);
          router.refresh();
        }
      })();
    });
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isPending}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? "border border-border hover:bg-muted"
          : "bg-foreground text-background hover:opacity-90"
      }`}
    >
      {isPending ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
