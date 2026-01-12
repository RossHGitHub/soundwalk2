import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueGranularity, RevenueSummary } from "../revenue";

type Props = {
  granularity: RevenueGranularity;
  onGranularityChange: (value: RevenueGranularity) => void;
  showRange: boolean;
  onToggleRange: () => void;
  revenueStart: string;
  revenueEnd: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onClearRange: () => void;
  summary: RevenueSummary;
};

export default function RevenueRundownSection({
  granularity,
  onGranularityChange,
  showRange,
  onToggleRange,
  revenueStart,
  revenueEnd,
  onStartChange,
  onEndChange,
  onClearRange,
  summary,
}: Props) {
  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "monthly", label: "Monthly" },
              { key: "quarterly", label: "Quarterly" },
              { key: "yearly", label: "Yearly" },
              { key: "all", label: "All time" },
            ] as const
          ).map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={granularity === option.key ? "default" : "outline"}
              onClick={() => onGranularityChange(option.key)}
            >
              {option.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={showRange ? "default" : "outline"}
            onClick={onToggleRange}
          >
            Date range
          </Button>
        </div>
        {showRange && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="revenueStart">Start date</Label>
              <Input
                id="revenueStart"
                type="date"
                value={revenueStart}
                onChange={(e) => onStartChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="revenueEnd">End date</Label>
              <Input
                id="revenueEnd"
                type="date"
                value={revenueEnd}
                onChange={(e) => onEndChange(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearRange}
              className="sm:mb-1"
            >
              Clear range
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gray-900/70 border-white/10">
          <CardHeader>
            <CardTitle>Total revenue</CardTitle>
            <CardDescription>Sum across the selected window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-300">
              £{summary.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/70 border-white/10">
          <CardHeader>
            <CardTitle>Total gigs</CardTitle>
            <CardDescription>Count of gigs in range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">
              {summary.totalGigs}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/70 border-white/10">
          <CardHeader>
            <CardTitle>Average per gig</CardTitle>
            <CardDescription>Helpful for forecasting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">
              £{summary.averageRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/70 border-white/10">
        <CardHeader>
          <CardTitle>Revenue trend</CardTitle>
          <CardDescription>
            Showing {summary.chartData.length || 0}{" "}
            {granularity === "all" ? "period" : "periods"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          {summary.chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-white/60">
              No revenue data for the selected range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chartData}>
                <XAxis dataKey="label" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <YAxis tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number) => [`£${value.toFixed(2)}`, "Revenue"]}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
