"use client"
import { Modal, ModalHeader, ModalTitle } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useEditor, EditorContent, EditorContext } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { useCandidateDetailStore } from "@/stores/useCandidateDetailStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatKey } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { EmailTemplateEnum } from "@/core/utils/enums/email-templates";
import { Input } from "@/components/ui/input";
import { GetEmailTemplateService, PostSendEmailDto, PostSendEmailService } from "@/core/candidates";
import { LogoutService } from "@/core/user";
import { useRouter } from "next/navigation";

interface EmailTemplate {
  title: string,
  value: EmailTemplateEnum,
}
const EMAIL_TEMPLATES: EmailTemplate[] = [
  { title: "Rejection candidate", value: EmailTemplateEnum.rejection },
  { title: "Information", value: EmailTemplateEnum.information },
  { title: "Approve to next step", value: EmailTemplateEnum.approve },
  { title: "Offering letter", value: EmailTemplateEnum.offering },
  { title: "Hired", value: EmailTemplateEnum.hired },
]
export default function SendEmailEditor(props: { defaultLoading?: boolean }) {
  const { detail } = useCandidateDetailStore()
  const [emailTemplateType, setEmailTemplateType] = useState<EmailTemplateEnum | "">("")
  const [loading, startLoading] = useTransition()
  const [subject, setSubject] = useState("")
  const [template, setTemplate] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (emailTemplateType == "") return
    startLoading(async () => {
      if (!detail?.id) return
      const res = await GetEmailTemplateService(detail.id, emailTemplateType)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (!res.isError) {
        setTemplate(res.data || "")
      } else {
        toast.error(res.message as string || "")
      }
    })
  }, [detail?.id, emailTemplateType, router])


  const handleSendEmail = () => {
    if (!detail?.id) return toast.error("Candidate not found")
    if (template == "") {
      toast.error("Email content are required")
    } if (subject == "") {
      toast.error("Email subject are required")
    }

    startLoading(async () => {
      const data: PostSendEmailDto = {
        body: template,
        subject
      }
      const res = await PostSendEmailService(detail?.id, data)
      if (res.isError) {
        toast.error(res.message)
      } else {
        toast.success("Success send email to candidate")
      }
    })
  }
  return <Modal
    trigger={<Button variant="outline" loading={props.defaultLoading}>Send email</Button>}
    dialogContentClassName="md:min-w-xl lg:min-w-3xl"
  >
    <ModalHeader>
      <ModalTitle>Send email</ModalTitle>
    </ModalHeader>
    <section className="space-y-4">
      <div className="flex justify-end gap-2">
        <Select value={emailTemplateType} onValueChange={(val) => setEmailTemplateType(val as EmailTemplateEnum)}>
          <SelectTrigger>
            {emailTemplateType || "Pick email template"}
          </SelectTrigger>
          <SelectContent>
            {EMAIL_TEMPLATES.map(item => <SelectItem key={item.value} value={item.value}>{item.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <div>
          <Button loading={loading || props.defaultLoading} onClick={() => handleSendEmail()}>Send email</Button>
        </div>
      </div>
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject email" />
      <EmailEditor defaultContent={template} updateTemplate={setTemplate} />
    </section>
  </Modal>
}

interface EmailEditorProps {
  defaultContent: string,
  updateTemplate: (template: string) => void
}
function EmailEditor(props: EmailEditorProps) {
  const { detail } = useCandidateDetailStore()
  const editor = useEditor({
    extensions: [StarterKit],
    content: props.defaultContent,
    onUpdate: ({ editor }) => {
      props.updateTemplate(editor?.getHTML())
    },
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })


  useEffect(() => {
    if (editor && props.defaultContent) {
      editor.commands.setContent(props.defaultContent, { emitUpdate: false })
    }
  }, [props.defaultContent, editor])


  // const addCandidateDetail = () => 
  const handleInsertContent = (value: string) => {
    if (editor == null) return
    editor.chain().focus().insertContent(value).run()
  }
  return <EditorContext.Provider value={{ editor }}>
    <div className="flex gap-2 p-2 bg-background-darker rounded-sm mb-4">
      <MarkButton
        type="bold"
      />
      <MarkButton type="italic" />
      {
        detail &&
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-neutral-200 px-2 rounded-sm flex gap-1 items-center">
            User detail <ChevronDown className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <UserDetailContent content={{ profile: detail.profile, interview: detail.interview, codingTest: detail.codingTest, survey: detail.survey }} itemClick={handleInsertContent} />
          </DropdownMenuContent>
        </DropdownMenu>
      }
    </div>
    <EditorContent editor={editor} className="h-40 md:h-64 overflow-auto border rounded-sm p-4 focus:outline-none focus:ring-0 " />
  </EditorContext.Provider>
}

interface UserDetailContentProps {
  content: Record<string, unknown>;
  grouped?: boolean;
  itemClick: (value: string) => void
};
export const UserDetailContent = ({ content, itemClick }: UserDetailContentProps) => {
  return (
    <>
      {Object.entries(content).map(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return (
            <DropdownMenuGroup key={key}>
              <DropdownMenuLabel>{formatKey(key)}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <UserDetailContent content={value as Record<string, unknown>} grouped itemClick={itemClick} />
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          );
        }

        return (
          <DropdownMenuItem key={key} onClick={() => itemClick((value as string | number).toString())}>
            {String(formatKey(key))}
          </DropdownMenuItem>
        );
      })}
    </>
  );
};