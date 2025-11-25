
import { Table } from "@tanstack/react-table"
//  Icons for Pagination Buttons
import {
  ChevronLeft, // First page << 
  ChevronRight, // Previous page < 
  ChevronsLeft, // Next Page >
  ChevronsRight, // Last Page >> 
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { useSearchParams } from "next/navigation"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"



interface DataTablePaginationProps<TData> {
  table: Table<TData> // Table instance (for TanStack features)
  totalPage: number // Total number of pages from backend 
}

export function DataTablePagination<TData>({
  table,
  totalPage = 1
}: DataTablePaginationProps<TData>) {
  const searchParams = useSearchParams()
  const { updateSearchParams } = useUpdateSearchParams()
  const page = +(searchParams.get("page") || "1")   // Current page (convert string to number)
  const perPage = +(searchParams.get("per_page") || "10") //Items per page 
  // (+)  converts string to number 

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>

        {/* Rows per page selector */}
        <Select
          value={perPage.toString()}
          onValueChange={(value) => {
            updateSearchParams("per_page", value)
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={perPage} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 25, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {page} of{" "}
        {totalPage}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 lg:flex"
          onClick={() => updateSearchParams("page", "1")}
          disabled={page <= 1}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => updateSearchParams("page", (page - 1).toString())}
          disabled={page <= 1}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => updateSearchParams("page", (page + 1).toString())}
          disabled={page >= totalPage}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 lg:flex"
          onClick={() => updateSearchParams("page", totalPage.toString())}
          disabled={page >= totalPage}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  )
}
