"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string): Promise<{ success: boolean; isFollowing: boolean }> {
  const supabase = await createClient();

  // SECURITY: Always verify authentication server-side
  // Get authenticated user from server session (NOT from client props)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // SECURITY: Block unauthenticated requests
  if (authError || !user) {
    console.error("Unauthorized follow attempt:", authError);
    return { success: false, isFollowing: false };
  }

  // Prevent self-follow
  if (user.id === targetUserId) {
    return { success: false, isFollowing: false };
  }

  // Check current follow status
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existingFollow) {
    // Unfollow - RLS ensures auth.uid() = follower_id
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("Unfollow error:", error);
      return { success: false, isFollowing: true };
    }

    revalidatePath("/explore");
    return { success: true, isFollowing: false };
  } else {
    // Follow - RLS ensures auth.uid() = follower_id
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });

    if (error) {
      console.error("Follow error:", error);
      return { success: false, isFollowing: false };
    }

    revalidatePath("/explore");
    return { success: true, isFollowing: true };
  }
}
