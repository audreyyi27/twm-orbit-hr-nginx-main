"use client"
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/table-column-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Candidate } from "@/core/candidates";

export const CodingTestColumnn: ColumnDef<Candidate>[] = [
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
    accessorKey: "Name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => row.original.profile.name,
    sortingFn: (a, b) => (a.original.profile.name || "-")?.localeCompare(b.original.profile.name || "-"),

  },
  {
    accessorKey: "Score",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Score" />
    ),
    cell: ({ row }) => row.original.codingTest.codingScore,
    sortingFn: (a, b) => Number(a.original.codingTest.codingScore) - Number(b.original.codingTest.codingScore)
  },
  {
    accessorKey: "Language confirmation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language Confirmation" />
    ),
    cell: ({ row }) => row.original.codingTest.testLanguageConfirmation,
    sortingFn: (a, b) => (a.original.codingTest.testLanguageConfirmation || "-")?.localeCompare(b.original.codingTest.testLanguageConfirmation || "-"),

  },
  {
    accessorKey: "Test date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Test date" />
    ),
    cell: ({ row }) => row.original.codingTest.codingTestDate ? new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(row.original.codingTest.codingTestDate || "")) : "-",
    sortingFn: (a, b) => {
      const dateA = a.original.codingTest.codingTestDate ? new Date(a.original.codingTest.codingTestDate).getTime() : 0;
      const dateB = b.original.codingTest.codingTestDate ? new Date(b.original.codingTest.codingTestDate).getTime() : 0;
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