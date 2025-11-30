export interface MetadataDto {
  per_page: number;
  page: number;
  total_pages: number;
  total_items?: number; // optional for backward compatibility
}
