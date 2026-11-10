export default function AuthHeading({
  title,
  subtitle,
  style,
}: {
  title: string
  subtitle: string
  style?: React.CSSProperties
}) {
  return (
    <div className="mb-6" style={style}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
