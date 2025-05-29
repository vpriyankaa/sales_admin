export function createTimeFrameExtractor(
  selectedTimeFrame: string | undefined,
) {
  return (sectionKey: string) => {
    return selectedTimeFrame
      ?.split(",")
      .find((value) => value.includes(sectionKey));
  };
}


// Date conversion 
export function formatDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getTodayDateRange() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return {
    dateFrom: startOfToday,
    dateTo: endOfToday,
  };
}

export function formatForDateTimeLocal(isoDateString: string) {
  if (!isoDateString) return ''; // Handle empty or null dates
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
