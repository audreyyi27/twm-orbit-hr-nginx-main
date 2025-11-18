"use client"
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/table-column-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import DownloadResume from "./download-resume";
import { Candidate, stagesOrderFormatter } from "@/core/candidates";
import CandidateStatusDisplay from "./candidate-status-display";

const toValidDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const DefaultColumnn: ColumnDef<Candidate>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => row.original.profile.name,
    sortingFn: (a, b) => (a.original.profile.name || "-")?.localeCompare(b.original.profile.name || "-"),
    enableHiding: false

  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => row.original.profile.email,
    sortingFn: (a, b) => a.original.profile.email.localeCompare(b.original.profile.email),
    enableHiding: false
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Whatsapp" />
    ),
    cell: ({ row }) => row.original.profile.whatsapp,
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Current Status" />
    ),
    cell: ({ row }) => <span className="capitalize">
      <CandidateStatusDisplay status={row.original.processedStatus} title={row.original.processedStatus.replaceAll("_", " ")} />
    </span>,
    sortingFn: (a, b) => stagesOrderFormatter(a.original.processedStatus) - stagesOrderFormatter(b.original.processedStatus)

  },
  {
    accessorKey: "appliedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Applied at" />
    ),
    cell: ({ row }) => {
      const appliedDate = toValidDate(row.original.appliedAt);

      return (
        <span className="capitalize">
          {appliedDate ? format(appliedDate, "PPp") : "—"}
        </span>
      );
    },
    sortingFn: (a, b) => {
      const dateA = toValidDate(a.original.appliedAt)?.getTime() ?? 0;
      const dateB = toValidDate(b.original.appliedAt)?.getTime() ?? 0;
      return dateA - dateB;
    }
  },
  {
    accessorKey: "action",
    header: () => (
      <></>
    ),
    cell: ({ row }) => {

      return <span className="space-x-2 flex justify-end">
        <DownloadResume id={row.original.id} />
        <Button size={"sm"} asChild>
          <Link href={"/candidates/" + row.original.id.toString()}>
            <Eye />
          </Link>
        </Button>
      </span>
    }
  },
] 