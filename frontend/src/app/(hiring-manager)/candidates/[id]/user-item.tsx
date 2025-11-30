import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface UserItemProps {
  label: string,
  value: string,
  isLoading?: boolean
}
export function UserItem(props: UserItemProps) {
  return <div className="space-y-2">
    <Label className="text-neutral-500">
      {props.label}
    </Label>
    {props.isLoading ?
      <Skeleton className="w-full h-6" />
      :
      <p className="font-semibold">{props.value}</p>
    }
  </div>
}
