"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ChevronDown } from "lucide-react"
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import type { Matcher } from "react-day-picker";

type DateRange = {
  from: Date | undefined;
  to?: Date;
};

type DateRangePickerProps = {
  onChange: (range: { dateFrom: string; dateTo: string }) => void
  initialDateFrom?: string
  initialDateTo?: string
  className?: string
}

type DatePreset = {
  name: string
  label: string
  getValue: () => DateRange
}

export function DateRangePicker({ onChange, initialDateFrom, initialDateTo, className }: DateRangePickerProps) {
const [isCalendarOpen, setIsCalendarOpen] = useState(false)
const [isPresetOpen, setIsPresetOpen] = useState(false)
const [selectedPreset, setSelectedPreset] = useState<string>("today")

  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })

const presets: DatePreset[] = [
  {
    name: "today",
    label: "Today",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    name: "yesterday",
    label: "Yesterday",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    name: "thisWeek",
    label: "This Week",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    name: "lastWeek",
    label: "Last Week",
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1)
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      }
    },
  },
  {
    name: "thisMonth",
    label: "This Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    name: "lastMonth",
    label: "Last Month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      }
    },
  },
  {
    name: "thisYear",
    label: "This Year",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
  {
    name: "lastYear",
    label: "Last Year",
    getValue: () => {
      const lastYear = subYears(new Date(), 1)
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      }
    },
  },
  {
    name: "custom",
    label: "Custom Range",
    getValue: () => ({ from: undefined, to: undefined }),
  },
]


useEffect(() => {
  if (dateRange.from && dateRange.to) {
    onChange({
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString(),
    });
  }
}, [dateRange, onChange]);


  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      setSelectedPreset(preset)
      setIsCalendarOpen(true) // Open calendar
      setIsPresetOpen(false)  // Close preset dropdown
      return
    }

    const selected = presets.find((p) => p.name === preset)
    if (selected) {
      const range = selected.getValue()
      setDateRange(range)
      setSelectedPreset(preset)
      setIsCalendarOpen(false)
      setIsPresetOpen(false)
    }
  }


  // console.log("selectedPreset", selectedPreset);
  // console.log("isCalendarOpen", isCalendarOpen);



const [hoveredDate, setHoveredDate] = useState<Date | undefined>();



  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range)
      if (range.from && range.to) {
        setSelectedPreset("custom")
        setIsCalendarOpen(false)
      }
    }
  }


  const formatDateRange = () => {
    if (selectedPreset !== "custom") {
      const preset = presets.find((p) => p.name === selectedPreset)
      return preset?.label || "Select date range"
    }

    if (dateRange.from && dateRange.to) {
      if (format(dateRange.from, "PP") === format(dateRange.to, "PP")) {
        return format(dateRange.from, "PPP")
      }
      return `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
    }

    return "Select date range"
  }


const rangeHover: Matcher | undefined =
  dateRange.from && !dateRange.to && hoveredDate
    ? {
      from: dateRange.from,
      to: hoveredDate > dateRange.from ? hoveredDate : dateRange.from,
    }
    : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPresetOpen} onOpenChange={setIsPresetOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range-preset"
            variant="outline"
            className={cn(
              "justify-between font-semibold text-left w-full h-[40px] md:w-[260px]",
              !dateRange && "text-muted-foreground dark:!text-black",
            )}
          >
            <span>{formatDateRange()}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white text-dark-3  dark:!text-white dark:bg-gray-dark font-semibold" align="start">
          <Command>
            <CommandInput />
            <CommandList>
              <CommandEmpty></CommandEmpty>
              <CommandGroup>
                {presets.map((preset) => (
                  <CommandItem key={preset.name} value={preset.name} onSelect={() => handlePresetChange(preset.name)}>
                    {preset.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedPreset === "custom" && isCalendarOpen && (
        <Popover open>

          <PopoverTrigger asChild>
            <span className="inline-block h-0 w-0" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={dateRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              onDayMouseEnter={(date) => setHoveredDate(date)}
              modifiers={{
                ...(rangeHover && { range_hover: rangeHover })
              }}
              modifiersClassNames={{
                range_hover: "bg-primary text-white", 
              }}
            />
          </PopoverContent>
        </Popover>
      )}

    </div>
  )
}


