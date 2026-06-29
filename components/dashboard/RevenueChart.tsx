"use client";
// components/dashboard/RevenueChart.tsx
//
// Client component — Recharts renders SVG in the browser.
// It can't run on the server because it needs DOM APIs.
//
// We use AreaChart (filled line chart) — looks better than
// a bar chart for revenue over time.
//
// The data is computed server-side in page.tsx and passed
// in as a prop, so there's no additional fetch here.

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  label: string;
  revenue: number;
}

interface RevenueChartProps {
  data: DataPoint[];
}

// Custom tooltip that matches the store design
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1C1917",
        border: "none",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "13px",
        color: "#f0ede8",
      }}
    >
      <p
        style={{
          color: "rgba(240,237,232,0.5)",
          marginBottom: 2,
          fontSize: 11,
        }}
      >
        {label}
      </p>
      <p style={{ fontFamily: "DM Serif Display, serif", fontSize: 16 }}>
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Only show every 5th label on the x-axis so they don't overlap
  const tickInterval = 4;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
      >
        <defs>
          {/* Gradient fill under the line */}
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C4613A" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#C4613A" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E8E4DF"
          vertical={false}
        />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#A8A39D" }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />

        <YAxis
          tick={{ fontSize: 11, fill: "#A8A39D" }}
          tickLine={false}
          axisLine={false}
          // Format Y axis as dollars
          tickFormatter={(v) => `$${v}`}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#C4613A"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false} // no dots on the line — cleaner
          activeDot={{ r: 4, fill: "#C4613A", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
