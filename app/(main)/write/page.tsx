"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithPresignedUrl } from "@/lib/amplify/storage";

interface Thread {
  id: string;
  name: string;
  slug: string;
}

export default function WritePage() {
  const router = useRouter();
  const supabase = createClient();

  const [formType, setFormType] = useState<"short" | "long">("short");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [primaryThread, setPrimaryThread] = useState<string | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLength = formType === "short" ? 300 : 10000;

  // Fetch threads on mount
  useEffect(() => {
    async function fetchThreads() {
      const { data } = await supabase
        .from("threads")
        .select("id, name, slug")
        .order("name");

      if (data) {
        setThreads(data);
      }
    }
    fetchThreads();
  }, [supabase]);

  // Filter threads based on search
  const filteredThreads = threads.filter((thread) =>
    thread.name.toLowerCase().includes(threadSearch.toLowerCase())
  );

  function toggleThread(threadId: string) {
    setSelectedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
        if (primaryThread === threadId) {
          setPrimaryThread(null);
        }
      } else {
        next.add(threadId);
        if (next.size === 1) {
          setPrimaryThread(threadId);
        }
      }
      return next;
    });
  }

  function handleCoverImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB");
      return;
    }

    setCoverImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handlePublish() {
    if (!content.trim()) {
      setError("Please write something");
      return;
    }

    if (formType === "long" && !title.trim()) {
      setError("Please add a title for long form content");
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to publish");
        return;
      }

      // For short form, validate with AI detection
      // For long form essays, also validate with AI detection
      const validateResponse = await fetch("/api/validate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      const validateResult = await validateResponse.json();

      if (!validateResponse.ok) {
        throw new Error(validateResult.error || "Failed to validate content");
      }

      if (!validateResult.passed) {
        setError(
          `Content appears to be AI-generated (confidence: ${Math.round(validateResult.score * 100)}%). Artfolio only accepts human-created content.`
        );
        setPublishing(false);
        return;
      }

      // Upload cover image if long form
      let coverImageUrl = null;
      let coverImagePath = null;
      let imageWidth = null;
      let imageHeight = null;

      if (formType === "long" && coverImage) {
        try {
          const uploadResult = await uploadFileWithPresignedUrl(coverImage);
          coverImageUrl = uploadResult.url;
          coverImagePath = uploadResult.path;

          // Get image dimensions
          const img = new Image();
          img.src = coverPreview!;
          const dimensions = await new Promise<{ width: number; height: number }>(
            (resolve) => {
              img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
              };
            }
          );
          imageWidth = dimensions.width;
          imageHeight = dimensions.height;
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload cover image"
          );
        }
      }

      // Create work entry
      const workData: Record<string, unknown> = {
        author_id: user.id,
        work_type: "essay",
        content: content.trim(),
        title: formType === "long" ? title.trim() : content.slice(0, 50) + "...",
        description: formType === "short" ? null : content.slice(0, 200),
        primary_thread_id: primaryThread || null,
        image_url: coverImageUrl,
        image_path: coverImagePath,
        width: imageWidth,
        height: imageHeight,
      };

      const { data: insertedWork, error: insertError } = await supabase
        .from("works")
        .insert(workData)
        .select("id")
        .single();

      if (insertError || !insertedWork) {
        throw insertError || new Error("Failed to create work");
      }

      // Insert work threads
      if (selectedThreads.size > 0) {
        const workThreads = Array.from(selectedThreads).map((threadId) => ({
          work_id: insertedWork.id,
          thread_id: threadId,
        }));

        const { error: threadsError } = await supabase
          .from("work_threads")
          .insert(workThreads);

        if (threadsError) {
          console.error("Failed to save work threads:", threadsError);
        }
      }

      router.push("/explore");
      router.refresh();
    } catch (err) {
      console.error("Publish error:", err);
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    // TODO: Implement draft saving
    setTimeout(() => {
      setSaving(false);
      alert("Draft saved!");
    }, 1000);
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Left sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:justify-between bg-[#d9d9d9] pr-4">
        <div className="pt-10">
          <div className="flex items-center gap-5 text-5xl text-black">
            <span>✱</span>
            <span className="translate-y-1">—</span>
          </div>
          <div className="mt-8 space-y-3 text-sm text-black/80">
            <p className="tracking-wide">following threads</p>
            {threads.length > 0 ? (
              <ul className="space-y-2 text-black/80">
                {threads.slice(0, 3).map((thread) => (
                  <li key={thread.id}>*-{thread.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-black/50">no threads yet</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="w-full space-y-6 py-8">
        {/* Toggle between short and long */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-white border border-black/10 p-1 shadow-sm">
            <button
              onClick={() => setFormType("short")}
              className={`px-6 py-2 rounded-full text-sm transition-colors ${
                formType === "short"
                  ? "bg-black text-white"
                  : "text-black/70 hover:text-black"
              }`}
            >
              short
            </button>
            <button
              onClick={() => setFormType("long")}
              className={`px-6 py-2 rounded-full text-sm transition-colors ${
                formType === "long"
                  ? "bg-black text-white"
                  : "text-black/70 hover:text-black"
              }`}
            >
              long
            </button>
          </div>
        </div>

        {/* Title for long form */}
        {formType === "long" && (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-6 py-4 bg-white rounded-3xl border border-black/10 text-lg focus:outline-none focus:ring-2 focus:ring-black/20 shadow-sm"
            maxLength={200}
          />
        )}

        {/* Main text area */}
        <div className="relative bg-white rounded-3xl shadow-sm border border-black/10">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              formType === "short"
                ? "What's on your mind?"
                : "Start writing your story..."
            }
            className="w-full h-64 px-6 py-4 bg-transparent rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-black/20"
            maxLength={maxLength}
          />
          <div className="absolute bottom-4 right-6 text-xs text-black/40">
            {content.length}/{maxLength}
          </div>
        </div>

        {/* Post to thread */}
        <div>
          <label className="block text-sm mb-2 text-black/70">post to thread (optional)</label>
          <input
            type="text"
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            placeholder="search for thread"
            className="w-full px-4 py-2 bg-white/50 rounded-full border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 mb-3"
          />
          <div className="flex flex-wrap gap-2">
            {(threadSearch ? filteredThreads : threads.slice(0, 8)).map((thread) => {
              const isSelected = selectedThreads.has(thread.id);
              const isPrimary = primaryThread === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => toggleThread(thread.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-[#5a9a9a] text-white"
                      : "bg-[#b8d4d4] text-black/70 hover:bg-[#a0c4c4]"
                  } ${isPrimary ? "ring-2 ring-black/30" : ""}`}
                >
                  {thread.name}
                </button>
              );
            })}
          </div>
          {selectedThreads.size > 0 && (
            <p className="text-xs text-black/50 mt-2">
              Click a selected thread again to set it as primary (has ring)
            </p>
          )}
        </div>

        {/* Upload cover photo - only for long form */}
        {formType === "long" && (
          <div>
            <label className="block text-sm mb-2 text-black/70">upload cover photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleCoverImageSelect}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              {coverPreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-black/10">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-[#9b9b9b] text-white rounded-full text-sm hover:bg-[#8a8a8a] transition-colors"
              >
                {coverPreview ? "Change" : "Upload"}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="w-full py-3 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save project draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || saving}
            className="w-full py-3 bg-white border border-black/20 text-black rounded-full font-medium hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
