"use client"
import { Modal, ModalHeader, ModalTitle } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddCvForm from "./add-cv-form";

export default function AddCv() {
  const [open, setOpen] = useState(false)

  return <Modal
    isOpen={open}
    setOpen={setOpen}
    trigger={<Button variant={"secondary"}>Add CV Candidates</Button>}
    dialogContentClassName="overflow-y-auto max-h-screen max-sm:max-h-svh md:min-w-md lg:min-w-lg "
    drawerContentClassName=""
  >
    <ModalHeader>
      <ModalTitle>Add Cv Candidate </ModalTitle>
    </ModalHeader>
    <div className="max-sm:max-h-[90vh] overflow-auto">
      <AddCvForm onAfterSubmit={() => {
        setOpen(false)
        window.location.reload()
      }} />
    </div>
  </Modal>
}