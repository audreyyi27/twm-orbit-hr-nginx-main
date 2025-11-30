import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChangeEvent, useTransition } from "react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import FileInput from "@/components/form-input/file-upload"
import { toast } from "sonner"
import { PostBatchCandidateCvService, PostCandidateCvDto } from "@/core/candidates"
import { useRouter } from "next/navigation"
import { addCvSchema, AddCvSchemaType } from "./add-cv-schema"
import { LogoutService } from "@/core/user"
interface AddCandidateForm {
  onAfterSubmit: () => void
}


export default function AddCvForm(props: AddCandidateForm) {
  const formSchema = addCvSchema
  const router = useRouter()
  const form = useForm<AddCvSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateData: undefined,
    }
  })
  const [isLoading, startLoading] = useTransition()
  const onSubmit = async (value: AddCvSchemaType) => {
    startLoading(async () => {
      if (!Boolean(value.candidateData)) {
        toast("CV or Resume required")
      }
      // const cleanedCandidate = cleanCandidate(value.candidateInfo);

      const data: PostCandidateCvDto = {
        candidateCv: value.candidateData as File
      }
      const res = await PostBatchCandidateCvService(data)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError) {
        toast.error(res.message as string)
      } else {
        toast.message(res.message as string)
        props.onAfterSubmit()
      }

    })
  }
  const handleUploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked == null) return
    form.setValue("candidateData", picked);
  }
  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FileInput
        form={form}
        label="Upload Candidates"
        name="candidateData"
        description="Upload the candidate data as a ZIP file. Each file name must match the resume_url from candidate entry and contain no spaces. Example: misbakhul_kharis.pdf"
        inputOptions={{
          accept: ".zip"
        }}
        onChange={(e) => handleUploadFile(e)}
      />

      <Button className="!mt-8 w-full" loading={isLoading}>Add Candidate CV</Button>
    </form>
  </Form>
}