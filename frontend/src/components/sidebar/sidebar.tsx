"use client"
import Logo from "@/../public/logo.webp"
import { ChevronRight, File, Grid2X2, Power, User } from "lucide-react"
import Image from "next/image"
import { SidebarItem, SidebarSubMenuItem } from "./sidebar-item"
import { useEffect, useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client"
import { Button } from "../ui/button"
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/modal"

export interface SidebarRoute {
  id: string,
  url: string,
  icon: React.ReactNode,
  title: string,
  subMenu: SidebarRoute[]
}
const routes: Record<string, { title: string, route: SidebarRoute[] }> = {
  menu: {
    title: "Menu",
    route: [
      { id: "1", url: "/dashboard", icon: <Grid2X2 className="size-5" />, title: "Dashboard", subMenu: [] },
    ]
  },
  recruitement: {
    title: "Recruitment",
    route: [
      { id: "1", url: "/candidates", icon: <User className="size-5" />, title: "Candidates", subMenu: [] },
      { id: "2", url: "/report", icon: <File className="size-5" />, title: "Report", subMenu: [] }
    ]
  },
  humanResources: {
    title: "Human Resources",
    route: [
      { id: "1", url: "/teams", icon: <User className="size-5" />, title: "Teams", subMenu: [] },
      { id: "2", url: "/employees", icon: <User className="size-5" />, title: "Employees", subMenu: [] },
      { id: "3", url: "/projects", icon: <File className="size-5" />, title: "Projects", subMenu: [] }
    ]
  }
}


export default function HiringManagerSidebar() {
  const [open, setOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, startLoading] = useTransition()
  const { user, logout } = useAuth()
  const [displayName, setDisplayName] = useState("User")
  const [initials, setInitials] = useState("US")
  useEffect(() => {
    if (user?.username) {
      setDisplayName(user.username)
      setInitials(user.username.slice(0, 2).toUpperCase())
    }
  }, [user?.username])
  const handleLogout = async () => {
    startLoading(async () => {
      await logout(); // This now handles the redirect
      // No need for router.push here - logout function handles it
    })
    setShowLogoutModal(false); // close modal

  };
  return <>
    <aside className={cn("relative max-w-2xs w-full h-full bg-primary-foreground px-4 py-6 max-lg:fixed max-lg:top-0 max-lg:z-50", open ? "max-lg:left-0" : "max-lg:-left-72", "transition-all duration-500")}>
      {/* Header */}
      <span className="space-x-2 py-4 flex items-center">
        <Image src={Logo} alt="Orbit logo" width={24} className=" inline-block" />
        <span className="font-bold text-lg uppercase">Orbit HR</span>
      </span>

      {/* Toggle button */}
      <button className="lg:hidden absolute -right-6 top-4 w-6 h-8 rounded-r-md bg-primary-foreground" onClick={() => setOpen(prev => !prev)}>
        {
          <ChevronRight className={cn("transition-all duration-200 ease-in-out", open ? "rotate-180" : "rotate-0")} />
        }
      </button>


      {/* Content */}
      <section className="py-4">
        {Object.entries(routes).map(([key, value]) => <div key={key} className="py-2">
          <p className="font-semibold text-sm text-primary mb-2" >{value.title}</p>
          <div className="w-full space-y-1">
            {value.route.map(item =>
              item.subMenu.length > 0 ?
                <SidebarSubMenuItem
                  key={item.id} {...item} /> :
                <SidebarItem
                  key={item.id} {...item} />)}
          </div>
        </div>
        )}
      </section>


      {/* User */}
      <div className="flex justify-between w-full gap-2 absolute bottom-0 left-0 items-center p-4 border-t">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 rounded-full font-semibold aspect-square bg-secondary-foreground text-secondary uppercase grid place-content-center ">
            {initials}
          </div>
          <span className="font-semibold capitalize">
            {displayName}
          </span>
        </div>
        <Modal
          isOpen={showLogoutModal}
          setOpen={setShowLogoutModal}
          trigger={
            <Button variant={"link"} className="cursor-pointer" onClick={() => setShowLogoutModal(true)}><Power /></Button>
          }
        >
          <ModalHeader>
            <ModalTitle>Confirm Logout</ModalTitle>
            <ModalDescription>
              Are you sure you want to logout?
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button
              loading={isLoading}
              onClick={() => setShowLogoutModal(false)}
              variant={"ghost"}
            >
              Cancel
            </Button>
            <Button
              loading={isLoading}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </aside >
  </>
}



