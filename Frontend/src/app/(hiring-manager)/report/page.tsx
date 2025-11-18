import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DownloadForm from "./dowload-form";

export default function ReportPage() {
  return <section className="grid place-items-center h-full">
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">
          Download Recruitment Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DownloadForm />
      </CardContent>
    </Card>


  </section>

}