"use client"
import { useForm } from "react-hook-form"
import { downloadSchema, DownloadSchemaType, FILE_TYPE } from "./download-scheme"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import SelectInput from "@/components/form-input/select-input"
import DateInput from "@/components/form-input/date-input"
import RadioInput from "@/components/form-input/radio-input"
import { toast } from "sonner"
import { format } from "date-fns"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"
import { PostRecruitmentReportDto } from "@/core/reports/dto"
import { PostRecruitmentReportService } from "@/core/reports/services"
import { LogoutService } from "@/core/user"
import { useRouter } from "next/navigation"

const RECRUITMENT_FLOW = Object.values(CandidateStatusEnum).map(item => ({ title: item.replaceAll("_", " "), value: item }))

export default function DownloadForm() {
  const formSchema = downloadSchema
  const router = useRouter()
  const form = useForm<DownloadSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      endDate: new Date(),
      fileType: "excel",
      startDate: new Date(),
      recruitmentFlow: CandidateStatusEnum.all
    }
  })
  const [isLoading, startLoading] = useTransition()

  const onSubmit = async (value: DownloadSchemaType) => {
    startLoading(async () => {
      const data: PostRecruitmentReportDto = {
        candidate_status: value.recruitmentFlow as CandidateStatusEnum,
        end_date: format(value.endDate, "y-MM-d"),
        file_type: value.fileType as "excel" | "pdf",
        start_date: format(value.startDate, "y-MM-d")
      }
      const res = await PostRecruitmentReportService(data)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError || !res.data) {
        toast.error(res.message as string)
      } else {
        toast.message(res.message as string)
        const urlObj = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = urlObj;
        a.download = `Recruitment-report-${form.getValues("recruitmentFlow")}-from-${form.getValues("startDate")}-to-${form.getValues("endDate")}.xlsx`;     // respected for "attachment"; for "inline" PDFs some browsers still download
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlObj);
      }
    })
  }

  const startDateWatcher = form.watch("startDate")
  const endDateWatcher = form.watch("endDate")

  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <SelectInput form={form} name="recruitmentFlow" label="Recruitment process" options={RECRUITMENT_FLOW} />
      <div className="grid grid-cols-2 gap-4">
        <DateInput
          form={form}
          label="Start date"
          name="startDate"
          disabledDate={(date) => date < new Date("2025-01-01") || date > new Date(endDateWatcher) || date > new Date()}
        />
        <DateInput
          form={form}
          label="End date"
          name="endDate"
          disabledDate={(date) => date > new Date() || date < new Date(startDateWatcher) || date < new Date("2025-01-01")}

        />
      </div>
      <RadioInput form={form} label="File type" name="fileType" options={FILE_TYPE} />
      <Button className="!mt-8 w-full" type="submit" loading={isLoading} >Download report</Button>
    </form>
  </Form>
}