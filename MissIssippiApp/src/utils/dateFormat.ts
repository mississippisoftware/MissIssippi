export const makeDateStamp = (date: Date = new Date()) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

export const formatPrintTimestamp = (date: Date = new Date()) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Parses a batch timestamp string as UTC.
 * .NET backends often return DateTime values as ISO strings without a timezone indicator
 * (e.g. "2024-01-15T12:30:00"). Without a timezone suffix, the browser interprets them
 * as local time, causing displayed times to be offset from the actual save time.
 * This normaliser appends "Z" when no timezone is present so parsing is always UTC.
 */
const parseBatchTimestamp = (value: string): Date => {
  if (value && !value.endsWith("Z") && !/[+\-]\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}Z`);
  }
  return new Date(value);
};

export const formatBatchTimestamp = (value: string) =>
  parseBatchTimestamp(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
