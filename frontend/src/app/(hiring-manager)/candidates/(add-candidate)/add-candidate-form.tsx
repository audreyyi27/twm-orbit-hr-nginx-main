import { useForm } from "react-hook-form"
import { addCandidateSchema, AddCandidateSchemaType } from "./add-candidate-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChangeEvent, useTransition } from "react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import FileInput from "@/components/form-input/file-upload"
import { toast } from "sonner"
import { PostCandidateDto, PostNewCandidateService } from "@/core/candidates"
import { useRouter } from "next/navigation"
import { LogoutService } from "@/core/user"
interface AddCandidateForm {
  onAfterSubmit: () => void
}


export default function AddCandidateForm(props: AddCandidateForm) {
  const formSchema = addCandidateSchema
  const router = useRouter()
  const form = useForm<AddCandidateSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateData: undefined,
    }
  })
  const [isLoading, startLoading] = useTransition()
  const onSubmit = async (value: AddCandidateSchemaType) => {
    startLoading(async () => {
      if (!Boolean(value.candidateData)) {
        toast("Candidate data is required")
      }
      // const cleanedCandidate = cleanCandidate(value.candidateInfo);

      const data: PostCandidateDto = {
        candidateData: value.candidateData as File
      }
      const res = await PostNewCandidateService(data)
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
        description="Upload file candidate data with JSON format "
        inputOptions={{
          accept: ".json"
        }}
        onChange={(e) => handleUploadFile(e)}
      />

      <Button className="!mt-8 w-full" loading={isLoading}>Add candidate</Button>
    </form>
  </Form>
}