import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-6xl font-semibol tabular-nums tracking-tight text-muted-foreground/60">
        404
      </div>
      <div>
        <h1 className="text-lg font-medium">Not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
      >
        Back to apps
      </Link>

    </div>
  )
}
