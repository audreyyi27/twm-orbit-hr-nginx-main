import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useTransition } from "react"

interface ConfirmationModalProps {
  trigger: React.ReactNode,
  title: string,
  description: string,
  onApprove: (hrNote: string) => Promise<void>,
  approvalTitle: string
}
export default function ConfirmationModal(props: ConfirmationModalProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [isLoading, startloading] = useTransition()
  const handleApprove = async () => {
    startloading(async () => {
      await props.onApprove(note)
    })
  }
  return <Modal
    isOpen={open}
    setOpen={setOpen}
    trigger={props.trigger}
  >
    <ModalHeader>
      <ModalTitle>{props.title}</ModalTitle>
      <ModalDescription>{props.description}</ModalDescription>
    </ModalHeader>
    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note to candidate " />
    <ModalFooter>
      <Button variant={"destructive"} disabled={isLoading} onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant={"ghost"} loading={isLoading} onClick={handleApprove}>{props.approvalTitle}</Button>
    </ModalFooter>
  </Modal>
}