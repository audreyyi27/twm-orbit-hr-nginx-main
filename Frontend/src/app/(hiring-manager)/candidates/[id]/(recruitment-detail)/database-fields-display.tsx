"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Candidate } from "@/core/candidates";

interface DatabaseFieldsDisplayProps {
  candidate: Candidate;
}

export default function DatabaseFieldsDisplay({ candidate }: DatabaseFieldsDisplayProps) {
  const data = candidate.rawData;
  
  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Database Fields (29 Columns)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Information">
          <Field label="UUID" value={data.uuid} />
          <Field label="Name" value={data.name} />
          <Field label="Email" value={data.email} />
          <Field label="WhatsApp" value={data.whatsapp} />
          <Field label="Age (Umur)" value={data.umur?.toString()} />
          <Field label="Gender" value={data.gender} />
        </Section>

        {/* Professional Info */}
        <Section title="Professional Information">
          <Field label="Location (Lokasi)" value={data.lokasi} />
          <Field label="Total Experience (Pengalaman Total)" value={`${data.pengalaman_total} years`} />
          <Field label="Highest Degree (Gelar Tertinggi)" value={data.gelar_tertinggi} />
          <Field label="Interests (Minat)" value={data.minat} />
          <Field label="Preferred Location (Preferensi Lokasi)" value={data.preferensi_lokasi} />
          <Field label="Skills" value={data.skills} />
        </Section>

        {/* Salary & Position */}
        <Section title="Salary & Position">
          <Field label="Salary Expectation (Ekspektasi Gaji)" value={data.ekspektasi_gaji} />
          <Field label="Applied As" value={data.applied_as} />
          <Field label="Date Scraped" value={formatDate(data.date_scraped)} />
        </Section>

        {/* Education & Experience */}
        <Section title="Education & Experience">
          <Field label="Education (Pendidikan)" value={data.pendidikan} multiline />
          <Field label="Certificates (Sertifikat)" value={data.sertifikat} multiline />
          <Field label="Awards (Penghargaan)" value={data.penghargaan} multiline />
          <Field label="Awards from Preference (Penghargaan dari Preferensi)" value={data.penghargaan_dari_preferensi} multiline />
          <Field label="Organizations (Organisasi)" value={data.organisasi} multiline />
          <Field label="Volunteer Experience (Pengalaman Organisasi Relawan)" value={data.pengalaman_organisasi_relawan} multiline />
        </Section>

        {/* About */}
        <Section title="About">
          <Field label="About Me (Tentang Saya)" value={data.tentang_saya} multiline />
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <Field label="Instagram" value={data.instagram} link />
          <Field label="LinkedIn" value={data.linkedin} link />
          <Field label="GitHub" value={data.github} link />
          <Field label="CodePen" value={data.codepen} link />
          <Field label="Facebook" value={data.facebook} link />
          <Field label="Twitter" value={data.twitter} link />
        </Section>

        {/* Files */}
        <Section title="Files">
          <Field label="CV File" value={data.cv_file} />
        </Section>
      </CardContent>
    </Card>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{title}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({ 
  label, 
  value, 
  multiline = false, 
  link = false 
}: { 
  label: string; 
  value?: string | number; 
  multiline?: boolean;
  link?: boolean;
}) {
  if (!value || value === "" || value === 0) {
    return (
      <div className={multiline ? "md:col-span-2" : ""}>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-400 italic">-</dd>
      </div>
    );
  }

  if (link && typeof value === "string") {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm">
          <a 
            href={value.startsWith('http') ? value : `https://${value}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
        </dd>
      </div>
    );
  }

  return (
    <div className={multiline ? "md:col-span-2" : ""}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}


