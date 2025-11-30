import { FieldValues } from "react-hook-form"
import { BaseInputForm } from "."
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"

interface RadioInputProps<T extends FieldValues> extends BaseInputForm<T> {
  label: string,
  description?: string,
  options: { title: string, value: string }[]
}
export default function RadioInput<T extends FieldValues>(props: RadioInputProps<T>) {
  return <FormField
    control={props.form.control}
    name={props.name}
    render={({ field }) => (
      <FormItem className="space-y-2">
        <FormLabel>{props.label}</FormLabel>
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value}
            className="flex flex-col"
          >
            {props.options.map(item => <FormItem key={item.value} className="flex items-center gap-3">
              <FormControl>
                <RadioGroupItem value={item.value} />
              </FormControl>
              <FormLabel className="font-normal capitalize">
                {item.title}
              </FormLabel>
            </FormItem>)}
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
}