"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"
import { useDebounce } from "@/hooks/useDebounce"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import { cn } from "@/lib/utils"
import { useTableStore } from "@/stores/useDataTableStore"
import { format, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { DateRange } from "react-day-picker"

export default function SearchFilter() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const { updateSearchParams } = useUpdateSearchParams()
  // update URL parameters 
  const debounce = useDebounce<string>(search, 500)
  const { clearSelected } = useTableStore()
  const isFirstRender = useRef(true)
  
  useEffect(() => {
    // Skip the first render (page load/navigation)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Update URL when user types
    updateSearchParams("search", debounce)
  }, [debounce, updateSearchParams])
  useEffect(() => {
    clearSelected()
  }, [searchParams, clearSelected])
  return <div className="flex max-sm:flex-col max-sm:gap-2">
    <Input placeholder="Search candidate by name" className="sm:rounded-r-none" onChange={e => setSearch(e.target.value)} value={search} />
    <div className="min-w-[240px] max-sm:w-full">
      <DateFilter />
    </div>
    <SortBy />
  </div>
}

export function FilterByStatus() {
  const searchParams = useSearchParams();
  // show existing search when page loads 
  const { updateSearchParams } = useUpdateSearchParams()
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant={'outline'} className="rounded-l-none border-l-0">
        Filter by
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" >
      <DropdownMenuLabel>Candidate status</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {Object.values(CandidateStatusEnum).map(item =>
        <DropdownMenuCheckboxItem
          key={item} className="capitalize"
          checked={searchParams.get("filterBy") == item}
          onCheckedChange={() => updateSearchParams("filterBy", item)}
        >
          {item.replaceAll("_", " ")}
        </DropdownMenuCheckboxItem>)}
      <DropdownMenuCheckboxItem
        className="capitalize"
        checked={searchParams.get("filterBy") == "" || searchParams.get("filterBy") == undefined}
        onCheckedChange={() => updateSearchParams("filterBy", "")}
      >
        All
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
}

const SORTING_FILTER = [
  { value: "asc", title: "Oldest Applicant" },
  { value: "desc", title: "Newest Applicant" },
]
export function SortBy() {
  const searchParams = useSearchParams();
  const { updateSearchParams } = useUpdateSearchParams()

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant={'outline'} className="sm:rounded-l-none sm:border-l-0 h-10">
        {SORTING_FILTER.find(i => i.value == searchParams.get("sortBy"))?.title || SORTING_FILTER[0].title}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Sort by Date</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {SORTING_FILTER.map(item =>
        <DropdownMenuCheckboxItem
          key={item.value} className="capitalize"
          checked={(searchParams.get("sortBy") || SORTING_FILTER[0].value) == item.value}
          onCheckedChange={() => updateSearchParams("sortBy", item.value)}
        >
          {item.title}
        </DropdownMenuCheckboxItem>)}

    </DropdownMenuContent>
  </DropdownMenu>
}

export function DateFilter() {
  const searchParams = useSearchParams()
  const { updateMultipleSearchParams } = useUpdateSearchParams()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: searchParams.get("startDate") ? new Date(searchParams.get("startDate") || "") : subDays(new Date(), 30),
    to: searchParams.get("endDate") ? new Date(searchParams.get("endDate") || "") : new Date()
  })

  const handleUpdateDateRange = (val: DateRange | undefined) => {
    let fromDate = val?.from
    let toDate = val?.to
    if (!val?.from && !val?.to) {
      fromDate = subDays(new Date(), 30)
      toDate = new Date()
    } else if (!val.from) {
      fromDate = val.to
    } else if (!val.to) {
      toDate = val.from
    }
    setDateRange(val)
    updateMultipleSearchParams([
      { name: "startDate", value: format(fromDate as Date, "y-MM-d") },
      { name: "endDate", value: format(toDate as Date, "y-MM-d") },
    ])
  }
  return <Popover>
    <PopoverTrigger asChild>
      <Button
        variant={"outline"}
        className={cn(
          "min-w-[240px] w-full pl-3 text-left font-normal sm:rounded-none sm:border-l-0 h-10",
          !searchParams.get("dateRange") && "text-muted-foreground"
        )}
      >
        {dateRange?.from && dateRange.to ? (
          <span>{format(dateRange.from?.toString(), "PP")} - {format(dateRange.to?.toString(), "PP")}</span>
        ) : (
          <span>Pick a date</span>
        )}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={(e) => handleUpdateDateRange(e)}
        disabled={(date) =>
          date > new Date() || date < new Date("1900-01-01")
        }
        captionLayout="dropdown"
      />
    </PopoverContent>
  </Popover>
}