import { FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { BaseInputForm } from ".";
import { Input } from "../ui/input";
import { HTMLInputTypeAttribute, InputHTMLAttributes } from "react";


interface DefaultInputProps<T extends FieldValues> extends BaseInputForm<T> {
  label: string,
  description?: string,
  placeholder?: string,
  type: HTMLInputTypeAttribute
  inputOptions?: InputHTMLAttributes<HTMLInputElement>
}
export default function DefaultInput<T extends FieldValues>(props: DefaultInputProps<T>) {
  return <FormField
    control={props.form.control}
    name={props.name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{props.label}</FormLabel>
        <FormControl>
          <Input placeholder={props.placeholder} type={props.type}   {...field} {...props.inputOptions} />
        </FormControl>
        {props.description &&
          <FormDescription className="!mb-0">
            {props.description}
          </FormDescription>
        }
        <FormMessage />
      </FormItem>
    )}
  />
}