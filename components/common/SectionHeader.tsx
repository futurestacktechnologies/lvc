interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
}

export default function SectionHeader({
  badge,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {badge && (
        <div className="mb-4 inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-brand shadow-sm">
          {badge}
        </div>
      )}

      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
