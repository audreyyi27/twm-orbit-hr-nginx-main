export * from "./date-input";
export * from "./default-input";
export * from "./file-upload";
export * from "./radio-input";
export * from "./select-input";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export interface BaseInputForm<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
}
