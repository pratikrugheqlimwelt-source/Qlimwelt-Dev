import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="type-label">404</p>
      <h1 className="mt-4 font-serif text-4xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="type-cta mt-8 border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
      >
        Back to home
      </Link>
    </div>
  );
}
