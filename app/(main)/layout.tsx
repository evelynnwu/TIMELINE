export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-screen">
      {/* Navigation shell for authenticated users */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold">Artfolio</span>
              <div className="hidden sm:flex gap-6">
                <a href="/feed" className="text-muted-foreground hover:text-foreground">
                  Feed
                </a>
                <a href="/explore" className="text-muted-foreground hover:text-foreground">
                  Explore
                </a>
                <a href="/upload" className="text-muted-foreground hover:text-foreground">
                  Upload
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* User menu placeholder */}
              <div className="w-8 h-8 rounded-full bg-muted"></div>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
