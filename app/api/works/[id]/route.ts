import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the work to verify ownership and get image path
  const { data: work, error: fetchError } = await supabase
    .from("works")
    .select("id, author_id, image_path")
    .eq("id", id)
    .single();

  if (fetchError || !work) {
    return NextResponse.json({ error: "Work not found" }, { status: 404 });
  }

  // Verify ownership
  if (work.author_id !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own works" },
      { status: 403 }
    );
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("works")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Failed to delete work:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete work" },
      { status: 500 }
    );
  }

  // Return success with image_path so client can delete from Amplify Storage
  // Note: Storage deletion is now handled client-side with Amplify SDK
  return NextResponse.json({
    success: true,
    image_path: work.image_path,
  });
}
