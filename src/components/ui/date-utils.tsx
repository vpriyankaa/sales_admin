import { startOfDay, endOfDay } from "date-fns"

export function getTodayDateRange() {
  return {
    dateFrom: startOfDay(new Date()),
    dateTo: endOfDay(new Date()),
  }
}

export function formatForDateTimeLocal(dateString: string) {
  if (!dateString) return ""

  const date = new Date(dateString)

  // Format to YYYY-MM-DDThh:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
