'use client'

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useCallback, useState, useEffect } from "react"
import { useDebounce } from "@/hooks/useDebounce"

export function SearchFilter(){
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get("search") || "")
    
    // Debounce the search value - only trigger search after 500ms of no typing
    const debouncedSearch = useDebounce(search, 500)

    // Trigger search only when debounced value changes
    useEffect(() => {
        const currentSearch = searchParams.get("search") || ""
        
        // Only trigger search if the debounced value is different from URL param
        if (debouncedSearch !== currentSearch) {
            const parameter = new URLSearchParams(searchParams.toString())

            if(debouncedSearch){
                parameter.set("search", debouncedSearch)
            } else {
                parameter.delete("search")
            }

            parameter.set("page", "1") // Reset to page 1 when searching 
            router.push(`${pathname}?${parameter.toString()}`)
        }
    }, [debouncedSearch, searchParams, router, pathname])

    return(
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Search employees by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
            />
        </div>
    )
}
