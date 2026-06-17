import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { useTheme } from "@/components/theme-provider"

const COLORS = ["#818cf8", "#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#f87171"]

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return {
    tooltip: dark
      ? { background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0" }
      : { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    tick: dark ? "#94a3b8" : "#64748b",
    grid: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
  }
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const { tooltip: tooltipStyle, tick, grid } = useChartTheme()
  const monthly = useQuery({ queryKey: ["monthly"], queryFn: () => analyticsApi.monthly().then(r => r.data) })
  const topCustomers = useQuery({ queryKey: ["topCustomers"], queryFn: () => analyticsApi.topCustomers().then(r => r.data) })
  const categoryRev = useQuery({ queryKey: ["categoryRev"], queryFn: () => analyticsApi.categoryRevenue().then(r => r.data) })
  const bestProducts = useQuery({ queryKey: ["bestProducts"], queryFn: () => analyticsApi.bestProducts().then(r => r.data) })
  const ranking = useQuery({ queryKey: ["ranking"], queryFn: () => analyticsApi.customerRanking().then(r => r.data) })

  const monthlyData = monthly.data?.rows?.map((r: (string | number)[]) => ({ month: r[0], orders: r[1], revenue: r[2] })) ?? []
  const topCustData = topCustomers.data?.rows?.map((r: (string | number)[]) => ({ name: r[1], city: r[2], orders: r[3], spent: r[4] })) ?? []
  const catData = categoryRev.data?.rows?.map((r: (string | number)[]) => ({ category: r[0], orders: r[1], units: r[2], revenue: r[3] })) ?? []
  const prodData = bestProducts.data?.rows?.map((r: (string | number)[]) => ({ name: r[0], category: r[1], units: r[2], revenue: r[3] })) ?? []
  const rankData = ranking.data?.rows?.map((r: (string | number)[]) => ({ name: r[0], city: r[1], spent: r[2], rank: r[3] })) ?? []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Deep-dive into your sales data with SQL-powered charts</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Monthly Sales Trend */}
        <ChartCard title="Monthly Sales Trend">
          {monthly.isLoading ? <div className="h-52 animate-pulse bg-muted/50 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: tick }} />
                <YAxis tick={{ fontSize: 10, fill: tick }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="orders" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Category Revenue */}
        <ChartCard title="Category-wise Revenue">
          {categoryRev.isLoading ? <div className="h-52 animate-pulse bg-muted/50 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={catData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: tick }} />
                <YAxis tick={{ fontSize: 10, fill: tick }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {catData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Best Selling Products */}
        <ChartCard title="Best Selling Products (Units)">
          {bestProducts.isLoading ? <div className="h-52 animate-pulse bg-muted/50 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={prodData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: tick }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: tick }} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="units" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top Customers */}
        <ChartCard title="Top Customers by Spend">
          {topCustomers.isLoading ? <div className="h-52 animate-pulse bg-muted/50 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={topCustData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: tick }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: tick }} width={110} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Spent"]} />
                <Bar dataKey="spent" fill="#34d399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Customer Ranking Table */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-4">Customer Ranking (Window Function)</h2>
        {ranking.isLoading ? <div className="h-32 animate-pulse bg-muted/50 rounded-lg" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">City</th>
                  <th className="pb-3">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rankData.slice(0, 10).map((r: { rank: number; name: string; city: string; spent: number }) => (
                  <tr key={r.rank} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${r.rank <= 3 ? "gradient-primary text-white" : "bg-muted text-muted-foreground"}`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{r.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{r.city}</td>
                    <td className="py-2.5 font-semibold text-emerald-400">{formatCurrency(r.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
