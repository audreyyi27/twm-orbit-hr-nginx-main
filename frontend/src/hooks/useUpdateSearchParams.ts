import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const updateSearchParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const oldValue = params.get(name);
      
      // Normalize: treat null as empty string
      const normalizedOld = oldValue || "";
      const normalizedNew = value || "";
      
      // Only proceed if value actually changed
      if (normalizedOld === normalizedNew) {
        return;
      }
      
      // If value is empty, remove the parameter instead of setting it to empty
      if (normalizedNew === "") {
        params.delete(name);
      } else {
        params.set(name, normalizedNew);
      }
      
      // Reset to page 1 ONLY when filters change (not when navigating pages)
      const isFilterParam = ["search", "sortBy", "filterBy", "startDate", "endDate", "per_page"].includes(name);
      if (isFilterParam) {
        params.set("page", "1");
      }
      
      if (params.toString() == "") return;
      router.push(pathname + "?" + params.toString());
    },
    [searchParams, pathname, router]
  );
  
  const updateMultipleSearchParams = useCallback(
    (newParams: { name: string; value: string }[]) => {
      const params = new URLSearchParams(searchParams.toString());
      newParams.forEach((item) => params.set(item.name, item.value));
      
      // Simple fix: Always reset to page 1 for multiple param updates
      params.set("page", "1");
      
      if (params.toString() == "") return;
      router.push(pathname + "?" + params.toString());
    },
    [searchParams, pathname, router]
  );
  
  return { updateSearchParams, updateMultipleSearchParams };
}
