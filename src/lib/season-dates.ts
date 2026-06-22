const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isSeasonDateInput(value: string) {
  if (DATE_ONLY_PATTERN.test(value)) {
    return isValidDateOnly(value);
  }

  return !Number.isNaN(Date.parse(value));
}

function isValidDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeSeasonDateInput(
  value: string,
  boundary: "start" | "end"
) {
  if (DATE_ONLY_PATTERN.test(value)) {
    return boundary === "start"
      ? `${value}T00:00:00.000`
      : `${value}T23:59:59.999`;
  }

  return value;
}
