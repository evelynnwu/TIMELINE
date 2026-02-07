import Link from "next/link";

type ThreadLink = {
  id: string;
  name: string | null;
};

type Profile = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type ThreadLeftSidebarProps = {
  profile: Profile | null;
  threads: ThreadLink[];
};

export default function ThreadLeftSidebar({
  profile,
  threads,
}: ThreadLeftSidebarProps): JSX.Element {
  const displayName = profile?.display_name || profile?.username || "guest";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-6">
      <div className="rounded-2xl bg-[#d9d9d9] p-4 shadow-sm">
        <div className="relative overflow-hidden rounded-2xl bg-[#f2f2f2]">
          <div className="h-24 bg-white" />
          <div className="h-32 bg-[#9a9a9a]" />
          <div className="absolute left-1/2 top-16 -translate-x-1/2">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-24 w-24 rounded-full border-4 border-[#f2f2f2] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#f2f2f2] bg-[#d8d8d8] text-3xl text-black/70">
                {avatarLetter}
              </div>
            )}
          </div>
          <div className="flex justify-center pb-6 pt-10">
            {profile?.username ? (
              <Link
                href={`/${profile.username}`}
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

      <div className="rounded-2xl bg-[#d9d9d9] p-6 text-black">
        <div className="flex items-center gap-3 text-4xl font-[family-name:var(--font-jetbrains-mono)]">
          <span>✱</span>
          <span className="translate-y-1">—</span>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <p className="tracking-wide">following threads</p>
          {threads.length > 0 ? (
            <ul className="space-y-2 text-black/80">
              {threads.map((thread) => (
                <li key={thread.id}>
                  {thread.name ? (
                    <Link href={`/threads/${thread.id}`} className="hover:text-black">
                      *-{thread.name}
                    </Link>
                  ) : (
                    <span>*-untitled</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black/50">no threads yet</p>
          )}
        </div>
      </div>
    </aside>
  );
}
