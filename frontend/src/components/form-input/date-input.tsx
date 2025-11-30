import { FieldValues } from "react-hook-form"
import { BaseInputForm } from "."
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"

interface DateInputProps<T extends FieldValues> extends BaseInputForm<T> {
  label: string,
  description?: string
  disabledDate?: (date: Date) => boolean
}
export default function DateInput<T extends FieldValues>(props: DateInputProps<T>) {
  return <FormField
    control={props.form.control}
    name={props.name}
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel>{props.label}</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  " pl-3 text-left font-normal w-full",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "PP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={props.disabledDate}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
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