import { Badge } from "@/components/ui/badge"

type CategoryBadgeProps = {
  name: string
  color: string
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-2"
      style={{ backgroundColor: `${color}20`, color, borderColor: `${color}60` }}
    >
      <span
        className="h-1.5 w-1.5"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  )
}
