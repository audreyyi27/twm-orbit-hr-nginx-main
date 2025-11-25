import { FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { BaseInputForm } from ".";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


interface SelectInputProps<T extends FieldValues> extends BaseInputForm<T> {
  label: string,
  options: { title: string, value: string }[],
  description?: string
}
export default function SelectInput<T extends FieldValues>(props: SelectInputProps<T>) {
  return <FormField
    control={props.form.control}
    name={props.name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{props.label}</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a verified email to display" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {props.options.map(item => <SelectItem key={item.value} value={item.value} className="capitalize">{item.title}</SelectItem>)}

          </SelectContent>
        </Select>
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