import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { customersApi } from "@/lib/api"
import { formatCurrency, exportToCSV } from "@/lib/utils"
import { Search, Download, ChevronLeft, ChevronRight, Users } from "lucide-react"
import type { Customer } from "@/types"

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () => customersApi.list(page, 15, search).then(r => r.data),
  })

  const customers: Customer[] = data?.customers ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / 15)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} total customers</p>
        </div>
        <button
          onClick={() => exportToCSV(customers as unknown as Record<string, unknown>[], "customers")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}
            className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(8).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="size-12 mx-auto mb-3 opacity-30" />
            <p>No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-muted/30">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Signup Date</th>
                  <th className="px-5 py-3 font-medium">Orders</th>
                  <th className="px-5 py-3 font-medium">Total Spent</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {c.name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.city}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.signup_date}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{c.total_orders}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-400">{formatCurrency(c.total_spent)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        c.total_orders >= 3
                          ? "bg-emerald-500/10 text-emerald-400"
                          : c.total_orders === 0
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {c.total_orders >= 3 ? "VIP" : c.total_orders === 0 ? "Inactive" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "gradient-primary text-white" : "border border-border hover:bg-muted"}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
