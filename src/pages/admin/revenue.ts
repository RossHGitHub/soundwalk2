import type { Gig } from "./types";

export type RevenueGranularity = "monthly" | "quarterly" | "yearly" | "all";

type RevenueBucket = {
  label: string;
  total: number;
  sortValue: number;
};

export type RevenueSummary = {
  chartData: RevenueBucket[];
  totalRevenue: number;
  totalGigs: number;
  averageRevenue: number;
};

export function buildRevenueSummary({
  gigs,
  granularity,
  revenueStart,
  revenueEnd,
}: {
  gigs: Gig[];
  granularity: RevenueGranularity;
  revenueStart: string;
  revenueEnd: string;
}): RevenueSummary {
  const parseFee = (fee?: number | string) => {
    if (fee == null) return 0;
    if (typeof fee === "number") return Number.isFinite(fee) ? fee : 0;
    const numeric = Number(String(fee).replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const parseDate = (dateISO: string) => new Date(`${dateISO}T00:00:00`);

  const withParsed = gigs
    .map((gig) => ({
      date: parseDate(gig.date),
      revenue: parseFee(gig.fee),
    }))
    .filter((entry) => !isNaN(entry.date.getTime()));

  const minDate = withParsed.reduce<Date | null>(
    (acc, entry) => (acc && acc < entry.date ? acc : entry.date),
    null
  );
  const maxDate = withParsed.reduce<Date | null>(
    (acc, entry) => (acc && acc > entry.date ? acc : entry.date),
    null
  );

  const startDate = revenueStart
    ? new Date(`${revenueStart}T00:00:00`)
    : minDate;
  const endDate = revenueEnd
    ? new Date(`${revenueEnd}T23:59:59`)
    : maxDate;

  const filtered = withParsed.filter((entry) => {
    if (startDate && entry.date < startDate) return false;
    if (endDate && entry.date > endDate) return false;
    return true;
  });

  const totalRevenue = filtered.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalGigs = filtered.length;
  const averageRevenue = totalGigs > 0 ? totalRevenue / totalGigs : 0;

  const labelFormatter = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
  });

  const buckets = new Map<string, RevenueBucket>();

  filtered.forEach((entry) => {
    const date = entry.date;
    const year = date.getFullYear();
    const month = date.getMonth();
    let key = "";
    let label = "";
    let sortValue = date.getTime();

    if (granularity === "monthly") {
      key = `${year}-${month}`;
      label = labelFormatter.format(date);
    } else if (granularity === "quarterly") {
      const quarter = Math.floor(month / 3) + 1;
      key = `${year}-q${quarter}`;
      label = `Q${quarter} ${year}`;
      sortValue = new Date(year, (quarter - 1) * 3, 1).getTime();
    } else if (granularity === "yearly") {
      key = `${year}`;
      label = `${year}`;
      sortValue = new Date(year, 0, 1).getTime();
    } else {
      key = "all-time";
      label = "All time";
      sortValue = 0;
    }

    const current = buckets.get(key) || { label, total: 0, sortValue };
    current.total += entry.revenue;
    buckets.set(key, current);
  });

  const chartData = Array.from(buckets.values()).sort(
    (a, b) => a.sortValue - b.sortValue
  );

  return {
    chartData,
    totalRevenue,
    totalGigs,
    averageRevenue,
  };
}
