"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { RECRUITMENT_FLOW_ORDERS } from "@/core/candidates";
import { CandidateStatusEnum } from "@/core/utils/enums/candidates";

interface RecruitmentNodeFilterProps {
  data?: Record<CandidateStatusEnum, number> | { total: number }
}
export default function RecruitmentNodeFilter(props: RecruitmentNodeFilterProps) {
  const searchParam = useSearchParams()
  const { updateSearchParams } = useUpdateSearchParams()
  const [open, setOpen] = useState(true)
  
  // Handle both old format (Record) and new format ({ total })
  const getCount = (status: CandidateStatusEnum) => {
    if (!props.data) return 0;
    // If it's the new format with just total, show total for "all" status, 0 for others
    if ('total' in props.data) {
      return status === CandidateStatusEnum.all ? props.data.total : 0;
    }
    // Old format with per-status counts
    return props.data[status] || 0;
  };
  
  return <Card className={cn("h-full transition-all duration-500 ease-in-out", open ? "" : "gap-0")}>
    <CardHeader className="relative">
      <CardTitle>Recruitment flow</CardTitle>
      <Button variant={"ghost"} size={"icon"} className="md:hidden absolute right-2 -top-2" onClick={() => setOpen(prev => !prev)}>
        <ChevronDown className={cn("transition-all duration-500 ease-in-out", open ? "" : "rotate-180")} />
      </Button>
    </CardHeader>
    <CardContent className={cn("transition-all duration-500 w-full ease-in-out max-md:overflow-hidden ", open ? "max-sm:h-[660px] sm:max-md:h-[140px] max-md:py-3 " : "h-0 max-sm:py-0")}>
      <div className="flex max-sm:flex-col max-sm:justify-center gap-2 flex-wrap  items-center">
        {RECRUITMENT_FLOW_ORDERS.sort((a, b) => a.order - b.order).map(item => <RecruitmentNode
          key={item.value}
          onClick={() => updateSearchParams("filterBy", item.value)}
          title={item.title} isActive={(searchParam.get("filterBy") || CandidateStatusEnum.all) == item.value}
          isLastFlow={item.value == CandidateStatusEnum.hired}
          count={getCount(item.value)}
        />)}
      </div>
    </CardContent>
  </Card>
}

interface RecruitmentNodeProps {
  isActive?: boolean,
  onClick: () => void,
  title: string,
  isLastFlow?: boolean,
  count: number
}
function RecruitmentNode(props: RecruitmentNodeProps) {
  return <>
    <button onClick={() => props.onClick()} className={cn("relative px-4 py-2 rounded-sm text-xs font-semibold flex gap-1 items-center justify-center cursor-pointer bg-neutral-100 text-neutral-800 min-w-20 max-sm:w-full",
      props.isActive ? "bg-secondary-foreground text-secondary" : "",
      "hover:bg-secondary-foreground hover:text-secondary"
    )}>
      <span className="capitalize">
        {props.title}
      </span>
      <Badge
        className="h-4 min-w-4 rounded-full px-1 text-xs absolute -top-2 -right-2"
        variant={"default"}
      >
        {props.count}
      </Badge>
    </button>
    {!props.isLastFlow && <ArrowRight className="w-3 h-3 max-sm:rotate-90" />}
  </>
}