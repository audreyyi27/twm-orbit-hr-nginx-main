"use client"
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/table-column-header";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

import { Candidate } from "@/core/candidates";
import { Checkbox } from "@/components/ui/checkbox";

export const SurveyColumnn: ColumnDef<Candidate>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => row.original.profile.name,
    sortingFn: (a, b) => (a.original.profile.name || "-")?.localeCompare(b.original.profile.name || "-"),

  },
  {
    accessorKey: "Form response link",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Form response link" />
    ),
    cell: ({ row }) => row.original.survey.formResponsesLink,
    enableSorting: false
  },
  {
    accessorKey: "Remote work interest",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remote work interest" />
    ),
    cell: ({ row }) => row.original.survey.remoteWorkInterest,
    sortingFn: (a, b) => {
      const valA = a.original.survey.remoteWorkInterest ? 1 : 0
      const valB = b.original.survey.remoteWorkInterest ? 1 : 0
      return valA - valB // false (0) before true (1)
    },

  },
  {
    accessorKey: "action",
    header: () => (
      <></>
    ),
    cell: ({ row }) => {
      return <span className="flex justify-end">

        <Button size={"sm"} asChild>
          <Link href={`/candidates/${row.original.id.toString()}`}>
            <Eye />
          </Link>
        </Button>
      </span>
    }
  },
] 