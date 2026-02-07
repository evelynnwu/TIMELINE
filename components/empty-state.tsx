import Link from "next/link";

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ message, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <p className="text-muted-foreground mb-4">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-block px-6 py-2 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
