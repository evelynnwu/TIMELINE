import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">Artfolio</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Showcase Your{" "}
            <span className="text-primary">Human Creativity</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The first AI-free artist portfolio and social platform. Share your
            authentic work with a community that values and verifies human
            creativity.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-lg border border-border">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold mb-1">Portfolio</h3>
              <p className="text-sm text-muted-foreground">
                Build your professional artist portfolio
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border">
              <div className="text-2xl mb-2">✓</div>
              <h3 className="font-semibold mb-1">AI-Verified</h3>
              <p className="text-sm text-muted-foreground">
                All content verified as human-created
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold mb-1">Community</h3>
              <p className="text-sm text-muted-foreground">
                Connect with artists who share your passion
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-lg font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="/explore"
              className="border border-border px-8 py-3 rounded-md text-lg font-medium hover:bg-muted transition-colors"
            >
              Explore Works
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Artfolio. Empowering human creators.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
