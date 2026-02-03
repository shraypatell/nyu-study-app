const NY_TZ = "America/New_York";

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(date);
  const tzName = parts.find((part) => part.type === "timeZoneName")?.value;
  if (!tzName) return 0;

  const match = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
};

export const getNyDateStart = (date: Date = new Date(), offsetDays = 0) => {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parseInt(dateParts.find((part) => part.type === "year")?.value || "0", 10);
  const month = parseInt(dateParts.find((part) => part.type === "month")?.value || "1", 10);
  const day = parseInt(dateParts.find((part) => part.type === "day")?.value || "1", 10);

  const offsetMinutes = getTimeZoneOffsetMinutes(date, NY_TZ);
  const utcMillis = Date.UTC(year, month - 1, day + offsetDays, 0, 0, 0) - offsetMinutes * 60 * 1000;

  return new Date(utcMillis);
};
