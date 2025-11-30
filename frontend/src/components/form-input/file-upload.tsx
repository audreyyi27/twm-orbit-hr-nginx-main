import { FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { BaseInputForm } from ".";
import { Input } from "../ui/input";
import { ChangeEventHandler, HTMLInputTypeAttribute, InputHTMLAttributes } from "react";


interface FileInputProps<T extends FieldValues> extends BaseInputForm<T> {
  label: string,
  description?: string,
  placeholder?: string,
  inputOptions?: Omit<InputHTMLAttributes<HTMLInputElement>, HTMLInputTypeAttribute>
  onChange: ChangeEventHandler<HTMLInputElement>
}
export default function FileInput<T extends FieldValues>(props: FileInputProps<T>) {
  return <FormField
    control={props.form.control}
    name={props.name}
    render={() => (
      <FormItem>
        <FormLabel>{props.label}</FormLabel>
        <FormControl>
          <Input placeholder={props.placeholder} type={"file"} {...props.inputOptions} onChange={props.onChange} />
        </FormControl>
        {props.description &&
          <FormDescription>
            {props.description}
          </FormDescription>
        }
        <FormMessage />
      </FormItem>
    )}
  />
}