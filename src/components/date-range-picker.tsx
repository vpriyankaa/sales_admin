// "use client"

// import { useState, useEffect } from "react"
// import { CalendarIcon, ChevronDown } from "lucide-react"
// import {
//   format,
//   startOfDay,
//   endOfDay,
//   startOfWeek,
//   endOfWeek,
//   startOfMonth,
//   endOfMonth,
//   startOfYear,
//   endOfYear,
//   subDays,
//   subWeeks,
//   subMonths,
//   subYears,
// } from "date-fns"
// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Calendar } from "@/components/ui/calendar"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
// import type { Matcher } from "react-day-picker";

// type DateRange = {
//   from: Date | undefined;
//   to?: Date;
// };

// type DateRangePickerProps = {
//   onChange: (range: { dateFrom: string; dateTo: string }) => void
//   initialDateFrom?: string
//   initialDateTo?: string
//   className?: string
// }

// type DatePreset = {
//   name: string
//   label: string
//   getValue: () => DateRange
// }

// export function DateRangePicker({ onChange, initialDateFrom, initialDateTo, className }: DateRangePickerProps) {
// const [isCalendarOpen, setIsCalendarOpen] = useState(false)
// const [isPresetOpen, setIsPresetOpen] = useState(false)
// const [selectedPreset, setSelectedPreset] = useState<string>("today")

//   const [dateRange, setDateRange] = useState<DateRange>({
//     from: undefined,
//     to: undefined,
//   })

// const presets: DatePreset[] = [
//   {
//     name: "today",
//     label: "Today",
//     getValue: () => ({
//       from: startOfDay(new Date()),
//       to: endOfDay(new Date()),
//     }),
//   },
//   {
//     name: "yesterday",
//     label: "Yesterday",
//     getValue: () => ({
//       from: startOfDay(subDays(new Date(), 1)),
//       to: endOfDay(subDays(new Date(), 1)),
//     }),
//   },
//   {
//     name: "thisWeek",
//     label: "This Week",
//     getValue: () => ({
//       from: startOfWeek(new Date(), { weekStartsOn: 1 }),
//       to: endOfWeek(new Date(), { weekStartsOn: 1 }),
//     }),
//   },
//   {
//     name: "lastWeek",
//     label: "Last Week",
//     getValue: () => {
//       const lastWeek = subWeeks(new Date(), 1)
//       return {
//         from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
//         to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
//       }
//     },
//   },
//   {
//     name: "thisMonth",
//     label: "This Month",
//     getValue: () => ({
//       from: startOfMonth(new Date()),
//       to: endOfMonth(new Date()),
//     }),
//   },
//   {
//     name: "lastMonth",
//     label: "Last Month",
//     getValue: () => {
//       const lastMonth = subMonths(new Date(), 1)
//       return {
//         from: startOfMonth(lastMonth),
//         to: endOfMonth(lastMonth),
//       }
//     },
//   },
//   {
//     name: "thisYear",
//     label: "This Year",
//     getValue: () => ({
//       from: startOfYear(new Date()),
//       to: endOfYear(new Date()),
//     }),
//   },
//   {
//     name: "lastYear",
//     label: "Last Year",
//     getValue: () => {
//       const lastYear = subYears(new Date(), 1)
//       return {
//         from: startOfYear(lastYear),
//         to: endOfYear(lastYear),
//       }
//     },
//   },
//   {
//     name: "custom",
//     label: "Custom Range",
//     getValue: () => ({ from: undefined, to: undefined }),
//   },
// ]


// useEffect(() => {
//   if (dateRange.from && dateRange.to) {
//     onChange({
//       dateFrom: dateRange.from.toISOString(),
//       dateTo: dateRange.to.toISOString(),
//     });
//   }
// }, [dateRange, onChange]);


//   const handlePresetChange = (preset: string) => {
//     if (preset === "custom") {
//       setSelectedPreset(preset)
//       setIsCalendarOpen(true) // Open calendar
//       setIsPresetOpen(false)  // Close preset dropdown
//       return
//     }

//     const selected = presets.find((p) => p.name === preset)
//     if (selected) {
//       const range = selected.getValue()
//       setDateRange(range)
//       setSelectedPreset(preset)
//       setIsCalendarOpen(false)
//       setIsPresetOpen(false)
//     }
//   }


//   // console.log("selectedPreset", selectedPreset);
//   // console.log("isCalendarOpen", isCalendarOpen);



// const [hoveredDate, setHoveredDate] = useState<Date | undefined>();



//   const handleCalendarSelect = (range: DateRange | undefined) => {
//     if (range) {
//       setDateRange(range)
//       if (range.from && range.to) {
//         setSelectedPreset("custom")
//         setIsCalendarOpen(false)
//       }
//     }
//   }


//   const formatDateRange = () => {
//     if (selectedPreset !== "custom") {
//       const preset = presets.find((p) => p.name === selectedPreset)
//       return preset?.label || "Select date range"
//     }

//     if (dateRange.from && dateRange.to) {
//       if (format(dateRange.from, "PP") === format(dateRange.to, "PP")) {
//         return format(dateRange.from, "PPP")
//       }
//       return `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
//     }

//     return "Select date range"
//   }


// const rangeHover: Matcher | undefined =
//   dateRange.from && !dateRange.to && hoveredDate
//     ? {
//       from: dateRange.from,
//       to: hoveredDate > dateRange.from ? hoveredDate : dateRange.from,
//     }
//     : undefined;

//   return (
//     <div className={cn("grid gap-2", className)}>
//       <Popover open={isPresetOpen} onOpenChange={setIsPresetOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             id="date-range-preset"
//             variant="outline"
//             className={cn(
//               "justify-between font-semibold text-left w-full h-[41px] md:w-[260px]",
//               !dateRange && "text-muted-foreground dark:!text-black",
//             )}
//           >
//             <span>{formatDateRange()}</span>
//             <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-full p-0 bg-white text-dark-3  dark:!text-white dark:bg-gray-dark font-semibold" align="start">
//           <Command>
//             <CommandInput />
//             <CommandList>
//               <CommandEmpty></CommandEmpty>
//               <CommandGroup>
//                 {presets.map((preset) => (
//                   <CommandItem key={preset.name} value={preset.name} onSelect={() => handlePresetChange(preset.name)}>
//                     {preset.label}
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//       {selectedPreset === "custom" && isCalendarOpen && (
//         <Popover open>

//           <PopoverTrigger asChild>
//             <span className="inline-block h-0 w-0" />
//           </PopoverTrigger>
//           <PopoverContent className="w-auto p-0 bg-white" align="start">
//             <Calendar
//               initialFocus
//               mode="range"
//               selected={dateRange}
//               onSelect={handleCalendarSelect}
//               numberOfMonths={2}
//               onDayMouseEnter={(date) => setHoveredDate(date)}
//               modifiers={{
//                 ...(rangeHover && { range_hover: rangeHover })
//               }}
//               modifiersClassNames={{
//                 range_hover: "bg-calendar text-white", 
//               }}
//             />
//           </PopoverContent>
//         </Popover>
//       )}

//     </div>
//   )
// }

"use client"

import { useState, useEffect, useRef, useCallback } from "react" // Import useCallback
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
  const [clickedDates, setClickedDates] = useState<Date[]>([]); // To track multiple clicks for custom range

  // Ref for the calendar container/popover content
  const calendarRef = useRef<HTMLDivElement>(null);
  // Ref for the preset popover content
  const presetPopoverContentRef = useRef<HTMLDivElement>(null);
  // Ref for the main trigger button
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // State to store calendar positioning styles
  const [calendarPosition, setCalendarPosition] = useState<{ top: string; left?: string; right?: string }>({ top: 'auto' });


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

  // Initialize with "today" as default
  useEffect(() => {
    const todayPreset = presets.find(p => p.name === "today");
    if (todayPreset) {
      setDateRange(todayPreset.getValue());
    }
  }, []);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      onChange({
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
      });
    }
  }, [dateRange, onChange]);

  // Function to calculate and set calendar position
  const calculateCalendarPosition = useCallback(() => {
    if (triggerButtonRef.current) {
      const rect = triggerButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const calendarWidth = 580; // Approximate width of two-month calendar (adjust as needed) + padding/border
      const margin = 8; // Margin below the trigger button

      const top = rect.bottom + window.scrollY + margin; // Position below the trigger

      // Check if calendar overflows right side
      if (rect.left + calendarWidth > viewportWidth - 20) { // 20px buffer from right edge
        setCalendarPosition({
          top: `${top}px`,
          right: `${viewportWidth - rect.right}px`, // Align to the right edge of the trigger
          left: 'auto'
        });
      } else {
        // Align to the left of the trigger
        setCalendarPosition({
          top: `${top}px`,
          left: `${rect.left}px`,
          right: 'auto'
        });
      }
    }
  }, []);

  // Update calendar position when it opens or window resizes
  useEffect(() => {
    if (isCalendarOpen) {
      calculateCalendarPosition();
      window.addEventListener('resize', calculateCalendarPosition);
    } else {
      window.removeEventListener('resize', calculateCalendarPosition);
    }
    return () => window.removeEventListener('resize', calculateCalendarPosition);
  }, [isCalendarOpen, calculateCalendarPosition]);


  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      setSelectedPreset(preset);
      setIsPresetOpen(false); // Close preset dropdown
      setClickedDates([]); // Reset clicked dates for new custom range
      setDateRange({ from: undefined, to: undefined }); // Clear previous custom selection
      setIsCalendarOpen(true); // Open calendar immediately
      // Recalculate position after the calendar is set to open
      setTimeout(calculateCalendarPosition, 0);
      return;
    }

    const selected = presets.find((p) => p.name === preset);
    if (selected) {
      const range = selected.getValue();
      setDateRange(range);
      setSelectedPreset(preset);
      setIsCalendarOpen(false); // Close calendar if open
      setIsPresetOpen(false); // Close preset dropdown
      setClickedDates([]); // Clear clicked dates when switching from custom
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;

    if (selectedPreset === "custom") {
      const newClickedDates = [...clickedDates, date].sort((a, b) => a.getTime() - b.getTime());

      if (newClickedDates.length === 1) {
        setDateRange({ from: startOfDay(newClickedDates[0]), to: undefined });
        setClickedDates(newClickedDates); // Keep the first clicked date
      } else if (newClickedDates.length === 2) {
        setDateRange({ from: startOfDay(newClickedDates[0]), to: endOfDay(newClickedDates[1]) });
        setClickedDates([]); // Reset for the next pair of custom dates
        setIsCalendarOpen(false); // Close calendar after selecting a full range
      } else if (newClickedDates.length > 2) {
        // If more than two dates are clicked, start a new range with the third click as 'from'
        setDateRange({ from: startOfDay(newClickedDates[2]), to: undefined });
        setClickedDates([newClickedDates[2]]);
      }
    } else {
      setDateRange({ from: startOfDay(date), to: endOfDay(date) });
      setIsCalendarOpen(false);
    }
  };

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
    } else if (dateRange.from) {
      return `${format(dateRange.from, "PP")} - ...` // Indicate selection of 'from' date
    }

    return "Select date range"
  }

  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();

  const rangeHover: Matcher | undefined =
    dateRange.from && !dateRange.to && hoveredDate
      ? {
        from: dateRange.from,
        to: hoveredDate > dateRange.from ? hoveredDate : dateRange.from,
      }
      : undefined;

  // Effect to handle clicks outside the calendar and preset popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the calendar container/popover
      const isClickInsideCalendar = calendarRef.current && calendarRef.current.contains(event.target as Node);
      // Check if the click is inside the preset popover content
      const isClickInsidePresetPopover = presetPopoverContentRef.current && presetPopoverContentRef.current.contains(event.target as Node);
      // Check if the click is on the main trigger button
      const isClickOnTriggerButton = triggerButtonRef.current && triggerButtonRef.current.contains(event.target as Node);

      if (isCalendarOpen && !isClickInsideCalendar && !isClickInsidePresetPopover && !isClickOnTriggerButton) {
        setIsCalendarOpen(false);
        // If no range was selected in custom mode, default to "today"
        if (selectedPreset === "custom" && (!dateRange.from || !dateRange.to)) {
          const todayPreset = presets.find(p => p.name === "today");
          if (todayPreset) {
            setDateRange(todayPreset.getValue());
            setSelectedPreset("today");
            setClickedDates([]); // Clear clicked dates on reset
          }
        }
      }
    };

    if (isCalendarOpen || isPresetOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen, isPresetOpen, selectedPreset, dateRange, presets]);


  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPresetOpen} onOpenChange={setIsPresetOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerButtonRef} // Attach ref to the trigger button
            id="date-range-preset"
            variant="outline"
            className={cn(
              "justify-between font-semibold text-left w-full h-[41px] md:w-[260px]",
              !dateRange.from && "text-muted-foreground dark:!text-black",
            )}
          >
            <span>{formatDateRange()}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent ref={presetPopoverContentRef} className="w-full p-0 bg-white text-dark-3 dark:!text-white dark:bg-gray-dark font-semibold" align="start">
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

      {/* Render the calendar directly when isCalendarOpen is true and selectedPreset is custom */}
      {selectedPreset === "custom" && isCalendarOpen && (
        <div
          ref={calendarRef} // Attach ref here
          className="absolute z-50 mt-2 bg-white border rounded-md shadow-lg p-0"
          style={calendarPosition} // Apply dynamic position here
        >
          <Calendar
            initialFocus
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                // If a full range is selected by calendar, update directly
                setDateRange(range);
                setClickedDates([]);
                setIsCalendarOpen(false);
              } else if (range?.from) {
                // If only 'from' is selected, treat it as the first click in custom range
                handleCalendarSelect(range.from);
              }
            }}
            numberOfMonths={2}
            onDayMouseEnter={(date) => setHoveredDate(date)}
            modifiers={{
              ...(rangeHover && { range_hover: rangeHover })
            }}
            modifiersClassNames={{
              range_hover: "bg-calendar text-white",
            }}
          />
        </div>
      )}
    </div>
  )
}



