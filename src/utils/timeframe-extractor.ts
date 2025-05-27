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
