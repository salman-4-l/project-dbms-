export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 pt-10 pb-8 md:flex-row md:items-end md:justify-between md:pt-14">
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow && (
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-4xl tracking-tight text-balance md:text-5xl">{title}</h1>
        {description && (
          <p className="leading-relaxed text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
