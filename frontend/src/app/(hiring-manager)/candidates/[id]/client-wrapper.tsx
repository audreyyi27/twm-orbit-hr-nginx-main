"use client"
import dynamic from "next/dynamic"
const RecruitmentAction = dynamic(() => import("./recruitment-action").then(mod => mod.RecruitmentAction), { ssr: false })
const RecruitmentDetail = dynamic(() => import("./(recruitment-detail)/recruitment-detail"), { ssr: false })

export { RecruitmentAction, RecruitmentDetail }