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
          <Field label="Age" value={data.age?.toString()} />
          <Field label="Gender" value={data.gender} />
        </Section>

        {/* Professional Info */}
        <Section title="Professional Information">
          <Field label="Location" value={data.location} />
          <Field label="Experience (Months)" value={data.experience_month ? `${data.experience_month} months` : undefined} />
          <Field label="Highest Degree" value={data.highest_degree} />
          <Field label="Job Preference" value={data.job_preference} />
          <Field label="Location Preference" value={data.location_preference} />
          <Field label="Skills" value={data.skills} />
        </Section>

        {/* Salary & Position */}
        <Section title="Salary & Position">
          <Field label="Expected Salary" value={data.expected_salary} />
          <Field label="Applied As" value={data.applied_as} />
          <Field label="Date Scraped" value={formatDate(data.date_scraped)} />
          <Field label="Candidate Status" value={data.candidate_status} />
        </Section>

        {/* Education & Experience */}
        <Section title="Education & Experience">
          <Field label="Education" value={data.education} multiline />
          <Field label="Certificate" value={data.certificate} multiline />
          <Field label="Awards" value={data.awards} multiline />
          <Field label="Awards from Preference" value={data.awards_from_preference} multiline />
          <Field label="Organization" value={data.organization} multiline />
          <Field label="Volunteer Organization Experience" value={data.volunteer_organization_experience} multiline />
        </Section>

        {/* About */}
        <Section title="About">
          <Field label="About Me" value={data.about_me} multiline />
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <Field label="Instagram" value={data.instagram} link />
          <Field label="LinkedIn" value={data.linkedin} link />
          <Field label="GitHub" value={data.github} link />
          <Field label="CodePen" value={data.codepen} link />
          <Field label="Facebook" value={data.facebook} link />
          <Field label="Twitter" value={data.twitter} link />
          <Field label="Website" value={data.website} link />
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


