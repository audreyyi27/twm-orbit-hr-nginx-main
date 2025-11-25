"use client"
import dynamic from "next/dynamic"

const SearchFilter = dynamic(() => import("./search-filter"), { ssr: false })
const SelectedCandidateAction = dynamic(() => import("./selected-candidate-action"), { ssr: false })
const AddCandidate = dynamic(() => import("./(add-candidate)/add-candidate"), { ssr: false })
const RecruitmentNodeFilter = dynamic(() => import("./recruitment-node-filter"), { ssr: false })

export { SearchFilter, SelectedCandidateAction, AddCandidate, RecruitmentNodeFilter }
