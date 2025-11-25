"use client"
import { Modal, ModalDescription, ModalHeader, ModalTitle } from "@/components/modal";
import { Button } from "@/components/ui/button";
import AddCandidateForm from "./add-candidate-form";
import { useState, useTransition } from "react";
import { GetCandidateJsonTemplateService } from "@/core/candidates";
import { toast } from "sonner";

export default function AddCandidate() {
  const [open, setOpen] = useState(false)
  const [loading, startLoading] = useTransition()
  const handleDownlaodJsonFormat = () => {
    startLoading(async () => {
      const res = await GetCandidateJsonTemplateService()
      if (res.isError || !res.data) {
        toast.error(res.message)
      } else {
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a');
        a.href = url;
        a.download = "candidate JSON template";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    })
  }
  return <Modal
    isOpen={open}
    setOpen={setOpen}
    trigger={<Button>New candidate</Button>}
    dialogContentClassName="overflow-y-auto max-h-screen max-sm:max-h-svh md:min-w-md lg:min-w-2xl"
    drawerContentClassName=""
  >
    <ModalHeader>
      <ModalTitle>Add new Candidate </ModalTitle>
      <ModalDescription>download candidate format <span onClick={handleDownlaodJsonFormat} className="text-primary underline cursor-pointer">{loading ? "loading..." : "here"}</span></ModalDescription>
    </ModalHeader>
    <div className="max-sm:max-h-[90vh] overflow-auto">
      <AddCandidateForm onAfterSubmit={() => {
        setOpen(false)
        window.location.reload()
      }} />
    </div>
  </Modal>
}