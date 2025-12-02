'use client';

import dynamicImport from "next/dynamic";
import type { ProjectAttendanceMapItem } from "./project-map";

// Dynamically import ProjectAttendanceMap with SSR disabled to avoid Leaflet server-side errors
const ProjectAttendanceMap = dynamicImport(
  () => import("./project-map").then((mod) => ({ default: mod.ProjectAttendanceMap })),
  { ssr: false }
);

interface ProjectMapWrapperProps {
  items: ProjectAttendanceMapItem[];
}

export default function ProjectMapWrapper({ items }: ProjectMapWrapperProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <ProjectAttendanceMap items={items} />
    </div>
  );
}

