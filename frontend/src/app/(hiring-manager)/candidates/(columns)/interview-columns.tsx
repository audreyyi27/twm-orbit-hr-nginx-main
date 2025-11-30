"use client"
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/table-column-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Candidate } from "@/core/candidates";
import { Checkbox } from "@/components/ui/checkbox";

export const InterviewColumnn: ColumnDef<Candidate>[] = [
  {
    id: "select1",
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => row.original.profile.name,
    sortingFn: (a, b) => (a.original.profile.name || "-")?.localeCompare(b.original.profile.name || "-"),

  },
  {
    accessorKey: "Interveiw status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Interview status" />
    ),
    cell: ({ row }) => row.original.interview.interviewStatus || "-",
    sortingFn: (a, b) => (a.original.interview.interviewStatus || "-")?.localeCompare(b.original.interview.interviewStatus || "-"),

  },
  {
    accessorKey: "Meeting link",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Meeting link" />
    ),
    cell: ({ row }) => row.original.interview.meetingLink,
    enableSorting: false
  },
  {
    accessorKey: "scheduledAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Schedule at" />
    ),
    cell: ({ row }) => row.original.interview.interviewDate ? new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(row.original.interview.interviewDate || "")) : "-",
    sortingFn: (a, b) => {
      const dateA = a.original.interview.interviewDate ? new Date(a.original.interview.interviewDate).getTime() : 0;
      const dateB = b.original.interview.interviewDate ? new Date(b.original.interview.interviewDate).getTime() : 0;
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
        <Button size={"sm"} asChild>
          <Link href={`/candidates/${row.original.id.toString()}`}>
            <Eye />
          </Link>
        </Button>
      </span>
    }
  },

] 