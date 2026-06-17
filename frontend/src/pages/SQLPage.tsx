import { useState } from "react"
import { sqlApi, aiApi } from "@/lib/api"
import { exportToCSV } from "@/lib/utils"
import { Play, Wand2, Download, Loader2, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import type { QueryResult, PredefinedQuery } from "@/types"
import { useQuery } from "@tanstack/react-query"

const QUERY_DESCRIPTIONS: Record<string, string> = {
  total_revenue: "Total revenue, orders, and average order value",
  top_customers: "Top 10 customers by total spend",
  monthly_sales_trend: "Monthly revenue and order count trend",
  best_selling_products: "Best selling products by units sold",
  customer_ranking: "Customer ranking using SQL RANK() window function",
  repeat_customers: "Repeat customers using CTE",
  running_total: "Running total of revenue using window function",
  category_revenue: "Revenue breakdown by product category",
}

export default function SQLPage() {
  const [sql, setSql] = useState("SELECT c.name, ROUND(SUM(o.amount), 2) AS total_spent\nFROM customers c\nJOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id\nORDER BY total_spent DESC\nLIMIT 10")
  const [nlpQuery, setNlpQuery] = useState("")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [nlpLoading, setNlpLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPredefined, setShowPredefined] = useState(true)

  const { data: predefinedData } = useQuery<{ queries: PredefinedQuery[] }>({
    queryKey: ["predefined"],
    queryFn: () => sqlApi.listPredefined().then(r => r.data),
  })

  const runQuery = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await sqlApi.execute(sql)
      setResult(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail ?? "Query failed")
    } finally {
      setLoading(false)
    }
  }

  const convertNLP = async () => {
    if (!nlpQuery.trim()) return
    setNlpLoading(true)
    try {
      const res = await aiApi.nlpToSql(nlpQuery)
      setSql(res.data.sql)
    } catch {
      setError("NLP conversion failed")
    } finally {
      setNlpLoading(false)
    }
  }

  const runPredefined = async (name: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await sqlApi.runPredefined(name)
      setResult(res.data)
      setSql(predefinedData?.queries.find(q => q.name === name)?.sql ?? "")
    } catch {
      setError("Query failed")
    } finally {
      setLoading(false)
    }
  }

  const tableData = result
    ? result.rows.map((row) => Object.fromEntries(result.columns.map((col, i) => [col, row[i]])))
    : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SQL Analysis Engine</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Execute SQL queries or use natural language to query your data</p>
      </div>

      {/* NLP to SQL */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="size-4 text-violet-400" />
          <h2 className="font-semibold">Natural Language to SQL</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={nlpQuery}
            onChange={(e) => setNlpQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && convertNLP()}
            placeholder='e.g. "Show top 10 customers by revenue" or "Monthly sales trend"'
            className="flex-1 px-4 py-2.5 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button
            onClick={convertNLP}
            disabled={nlpLoading}
            className="px-4 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {nlpLoading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Convert
          </button>
        </div>
      </div>

      {/* Predefined Queries */}
      <div className="glass-card rounded-xl p-5">
        <button
          onClick={() => setShowPredefined(!showPredefined)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-indigo-400" />
            <h2 className="font-semibold">Predefined Queries</h2>
          </div>
          {showPredefined ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {showPredefined && (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {predefinedData?.queries.map((q) => (
              <button
                key={q.name}
                onClick={() => runPredefined(q.name)}
                className="text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
              >
                <div className="text-xs font-medium text-primary group-hover:text-primary capitalize">
                  {q.name.replace(/_/g, " ")}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {QUERY_DESCRIPTIONS[q.name] ?? ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SQL Editor */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">SQL Editor</h2>
          <button
            onClick={runQuery}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run Query
          </button>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono resize-none"
        />
        {error && <p className="mt-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Results</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {result.row_count} rows · {result.execution_time_ms}ms
              </span>
            </div>
            <button
              onClick={() => exportToCSV(tableData, "query-results")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              <Download className="size-3.5" /> CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  {result.columns.map((col) => (
                    <th key={col} className="pb-3 pr-4 font-medium capitalize">{col.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2.5 pr-4 text-muted-foreground">{String(cell ?? "—")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
