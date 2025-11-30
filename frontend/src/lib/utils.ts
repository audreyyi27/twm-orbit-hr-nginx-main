import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NestedRecord = {
  [key: string]: string | number | undefined | NestedRecord;
};
export function flattenObject(
  obj: NestedRecord,
  parentKey = "",
  result: Record<string, string | number | undefined> = {}
): Record<string, string | number | undefined> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // value is definitely a NestedRecord here
      flattenObject(value as NestedRecord, newKey, result);
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "undefined"
    ) {
      // now TypeScript is happy
      result[newKey] = value;
    }
  }
  return result;
}

export function formatKey(key: string): string {
  return (
    key
      // insert space before capital letters
      .replace(/([A-Z])/g, " $1")
      // capitalize first letter
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
}

export function cleanCandidate(
  obj: Record<string, string | number | undefined | unknown | null>
) {
  const cleaned: Record<string, string | number | undefined | unknown | null> =
    {};
  for (const [key, value] of Object.entries(obj)) {
    // skip empty strings
    if (value === "") continue;
    // skip null/undefined if needed
    if (value === null || value === undefined) continue;
    cleaned[key] = value;
  }
  return cleaned;
}
