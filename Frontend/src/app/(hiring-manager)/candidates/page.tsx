import DataTable from "./data-table";
import { GetCandidateCountService, GetCandidatesServices } from "@/core/candidates";
import { redirect } from "next/navigation";
import { AddCandidate, RecruitmentNodeFilter, SearchFilter, SelectedCandidateAction } from "./client-wrapper"
import AddCv from "./(add-cv-candidate)/add-cv";
export default async function RecruitmentPage({ searchParams }: PageProps<"/candidates">) {
  const { page, per_page, search, sortBy, filterBy, startDate, endDate } = await searchParams
  
  // Fix: Normalize URL - ensure per_page is always present
  if (!per_page) {
    const params = new URLSearchParams();
    params.set("page", (page as string) || "1");
    params.set("per_page", "10");  // Default per_page
    if (search) params.set("search", search as string);
    if (sortBy) params.set("sortBy", sortBy as string);
    if (filterBy) params.set("filterBy", filterBy as string);
    if (startDate) params.set("startDate", startDate as string);
    if (endDate) params.set("endDate", endDate as string);
    redirect(`/candidates?${params.toString()}`);
  }
  
  const [candidatesSummary, candidatesResult] = await Promise.all([
    GetCandidateCountService(), 
    GetCandidatesServices({
      page: (page as string) || "1",
      perPage: (per_page as string) || "10",
      filterBy: (filterBy as string) == "all" ? "" : filterBy as string,
      search: search as string || "",
      sortBy: sortBy as string || "desc",
      startDate: startDate as string || "",
      endDate: endDate as string || ""
    })
  ]);

  const { data, meta, statusCode, isError, message } = candidatesResult;

  // Log for debugging
  if (isError) {
    console.error("GetCandidatesServices error:", message, statusCode);
  }

  if (statusCode == 401 || statusCode == 403) {
    // Clear cookies first via API route, then redirect
    // This prevents middleware from seeing stale cookies and redirecting back
    redirect('/api/auth/clear-cookies')
  }

  // Show error message if there's an error
  if (isError && statusCode !== 401 && statusCode !== 403) {
    console.error("Failed to load candidates:", message);
  }

  // Fix: If current page exceeds total pages, redirect to page 1
  const currentPage = parseInt((page as string) || "1");
  const totalPages = meta?.totalPage || 1;
  
  if (currentPage > totalPages && totalPages > 0) {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (per_page) params.set("per_page", per_page as string);
    if (search) params.set("search", search as string);
    if (sortBy) params.set("sortBy", sortBy as string);
    if (filterBy) params.set("filterBy", filterBy as string);
    if (startDate) params.set("startDate", startDate as string);
    if (endDate) params.set("endDate", endDate as string);
    redirect(`/candidates?${params.toString()}`);
  }
  return <>
    <div className="flex justify-between w-full items-center">
      <h1 className="lg:text-xl font-semibold">All Candidates</h1>
      <div className="space-x-2">
        <SelectedCandidateAction />
        <AddCv />
        <AddCandidate />
      </div>

    </div>
    <section className="py-4 space-y-4 w-full">

      <RecruitmentNodeFilter data={candidatesSummary.data || undefined} />
      <SearchFilter />

      <DataTable
        page={page as string || "1"}
        perPage={per_page as string || "10"}
        filterBy={filterBy as string || undefined}
        candidates={data || []}
        meta={meta}
      />
    </section>
  </>
}