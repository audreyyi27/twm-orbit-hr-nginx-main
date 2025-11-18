"use client"

import useMediaQuery from "@/hooks/useMediaQuery"
import { ComponentProps } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"

interface ModalProps {
  children: React.ReactNode,
  trigger: React.ReactNode
  dialogContentClassName?: string,
  drawerContentClassName?: string,
  isOpen?: boolean,
  setOpen?: (val: boolean) => void
}
/**
 * Combination of Dialog and drawer
 */
export function Modal(props: ModalProps) {
  const isDesktop = useMediaQuery("(min-width:768px)")
  if (isDesktop) {
    return <Dialog open={props.isOpen} onOpenChange={(val) => {
      props.setOpen?.(val)
    }}>
      <DialogTrigger asChild>
        {props.trigger}
      </DialogTrigger>
      <DialogContent className={cn("sm:max-w-[425px]", props.dialogContentClassName)}>
        {props.children}
      </DialogContent>
    </Dialog>
  }
  return <Drawer open={props.isOpen} onOpenChange={(val) => {
    props.setOpen?.(val)
  }}>
    <DrawerTrigger asChild>
      {props.trigger}
    </DrawerTrigger>
    <DrawerContent className={cn("px-4 pb-4", props.drawerContentClassName)}>
      {props.children}
    </DrawerContent>
  </Drawer>
}


export function ModalHeader(props: ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width:768px)")
  if (isDesktop) {
    return <DialogHeader {...props}>
      {props.children}
    </DialogHeader>
  }
  return <DrawerHeader {...props}>
    {props.children}
  </DrawerHeader>
}

export function ModalTitle(props: ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width:768px)")
  if (isDesktop) {
    return <DialogTitle {...props}>{props.children}</DialogTitle>
  }
  return <DrawerTitle {...props}>
    {props.children}
  </DrawerTitle>
}

export function ModalFooter(props: ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width:768px)")
  if (isDesktop) {
    return <DialogFooter {...props}>
      {props.children}
    </DialogFooter>
  }
  return <DrawerFooter {...props}>
    {props.children}
  </DrawerFooter>
}

export function ModalDescription(props: ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width:768px)")
  if (isDesktop) {
    return <DialogDescription {...props}>
      {props.children}
    </DialogDescription>
  }
  return <DrawerDescription {...props}>
    {props.children}
  </DrawerDescription>
}
export function ModalContent(props: ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width:768px)")
  if (isDesktop) {
    return <DialogContent {...props}>
      {props.children}
    </DialogContent>
  }
  return <DrawerContent {...props}>
    {props.children}
  </DrawerContent>
}


