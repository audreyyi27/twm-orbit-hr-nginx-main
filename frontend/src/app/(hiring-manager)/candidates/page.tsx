import DataTable from "./data-table";
import { GetCandidatesServices } from "@/core/candidates";
import { redirect } from "next/navigation";
import { AddCandidate, RecruitmentNodeFilter, SearchFilter, SelectedCandidateAction } from "./client-wrapper"
import AddCv from "./(add-cv-candidate)/add-cv";
import { LogoutService } from "@/core/user";
export default async function RecruitmentPage({ searchParams }: PageProps<"/candidates">) {
  const { page, per_page, search, sortBy, filterBy, startDate, endDate } = await searchParams;

  // Normalize URL parameters early
  if (!per_page) {
    const params = new URLSearchParams();
    params.set("page", (page as string) || "1");
    params.set("per_page", "10");
    if (search) params.set("search", search as string);
    if (sortBy) params.set("sortBy", sortBy as string);
    if (filterBy) params.set("filterBy", filterBy as string);
    if (startDate) params.set("startDate", startDate as string);
    if (endDate) params.set("endDate", endDate as string);
    redirect(`/candidates?${params.toString()}`);
  }

  // First: fetch candidates list only. If unauthorized, short-circuit.
  const candidatesResult = await GetCandidatesServices({
    page: (page as string) || "1",
    perPage: (per_page as string) || "10",
    filterBy: (filterBy as string) === "all" ? "" : (filterBy as string) || "",
    search: (search as string) || "",
    sortBy: (sortBy as string) || "desc",
    startDate: (startDate as string) || "",
    endDate: (endDate as string) || ""
  });

  if (candidatesResult.statusCode === 401 || candidatesResult.statusCode === 403) {
    // Avoid calling logout twice server-side; just redirect.
    // Client middleware / auth provider will handle cookie clearing.
    redirect('/');
  }


  const { data, meta, statusCode, isError, message } = candidatesResult;

  if (isError && statusCode !== 401 && statusCode !== 403) {
    console.error("GetCandidatesServices error:", message, statusCode);
  }

  // If current page > total pages, redirect to page 1
  const currentPage = parseInt((page as string) || "1");
  const totalPages = meta?.totalPage || 1;
  if (currentPage > totalPages && totalPages > 0) {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per_page", (per_page as string) || "10");
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

      <RecruitmentNodeFilter data={{ total: meta?.totalItems || 0 }} />
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