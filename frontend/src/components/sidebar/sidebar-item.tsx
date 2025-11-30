"use client"
import Link from "next/link";
import { SidebarRoute } from "./sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";


interface SidebarItemProps extends SidebarRoute {
  isActive?: boolean
}
export function SidebarItem(props: SidebarItemProps) {
  const pathName = usePathname()
  return <Link href={props.url} className={cn("p-2 flex gap-2 rounded-sm font-semibold", pathName.startsWith(props.url) ? "bg-secondary-foreground text-secondary" : "hover:bg-secondary-foreground/50 text-accent-foreground/70")}>
    {props.icon}
    <p className="text-sm">
      {props.title}
    </p>
  </Link>
}

export function SidebarSubMenuItem(props: SidebarRoute) {
  return <>{props.title}</>
}