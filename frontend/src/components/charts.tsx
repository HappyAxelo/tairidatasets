"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#0056A6";
const PALETTE = ["#0056A6", "#1976D2", "#3f87d4", "#6fa5df", "#9fc3ea", "#127b45", "#b45309", "#64748b"];

const axisProps = {
  stroke: "#94a3b8",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

export function AreaTrend({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={34} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e9ee", fontSize: 12 }}
          cursor={{ stroke: "#cbd5e1" }}
        />
        <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} fill="url(#areaFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarRank({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          {...axisProps}
          width={140}
          tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 19) + "…" : v)}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e9ee", fontSize: 12 }}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Bar dataKey="value" fill={BRAND} radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutBreakdown({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0)
    return <p className="py-12 text-center text-sm text-ink-faint">No data yet</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
          {filtered.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e9ee", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
