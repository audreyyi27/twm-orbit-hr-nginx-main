"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./table-pagination"
import { Fragment, useEffect } from "react"
import { Row, useTableStore } from "@/stores/useDataTableStore"
import { Skeleton } from "../ui/skeleton"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  totalpage?: number,
  isLoading?: boolean

}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalpage,
  isLoading
}: DataTableProps<TData, TValue>) {
  const { rowSelection, setRowSelection, setData } = useTableStore();
  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    state: {
      rowSelection: rowSelection,
    }
  })
  useEffect(() => {
    setData(data as Row[])
  }, [data, setData])
  return (<>
    <div className="rounded-sm border ">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                if (isLoading) {
                  return <TableHead key={header.id}>
                    <Skeleton key={header.id} className="w-full h-4" />
                  </TableHead>
                }
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? <>
            {
              [1, 2, 3].map(item => {
                return <TableRow key={item}>
                  {table.getVisibleFlatColumns().map((item, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="w-full h-4" />
                    </TableCell>
                  ))}
                </TableRow>
              })
            }

          </> : <>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </>}
        </TableBody>
      </Table>
    </div>
    <DataTablePagination table={table} totalPage={totalpage || 1} />
  </>
  )
}