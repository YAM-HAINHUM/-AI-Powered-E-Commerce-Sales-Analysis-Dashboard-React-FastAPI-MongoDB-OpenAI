import { memo } from "react"
import { motion } from "framer-motion"
import { Calendar, Tag, MapPin, X, SlidersHorizontal } from "lucide-react"
import type { Filters, DateRange, CategoryFilter, RegionFilter } from "@/hooks/useDashboardFilters"

interface FiltersBarProps {
  filters: Filters
  onChange: (f: Filters) => void
}

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
]

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all",           label: "All Categories" },
  { value: "Electronics",   label: "Electronics" },
  { value: "Fashion",       label: "Fashion" },
  { value: "Home & Garden", label: "Home & Garden" },
  { value: "Sports",        label: "Sports" },
  { value: "Books",         label: "Books" },
]

const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [
  { value: "all",   label: "All Regions" },
  { value: "North", label: "North" },
  { value: "South", label: "South" },
  { value: "East",  label: "East" },
  { value: "West",  label: "West" },
]

const selectClass =
  "bg-muted border border-border text-foreground text-sm rounded-xl px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors hover:border-primary/40"

const isDefault = (f: Filters) =>
  f.dateRange === "all" && f.category === "all" && f.region === "all"

const activeLabel = (f: Filters): string[] => {
  const tags: string[] = []
  if (f.dateRange !== "all") tags.push(DATE_OPTIONS.find(o => o.value === f.dateRange)!.label)
  if (f.category  !== "all") tags.push(f.category)
  if (f.region    !== "all") tags.push(f.region)
  return tags
}

function SelectWrapper({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      <Icon className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none z-10" />
      <div className="pl-7">{children}</div>
    </div>
  )
}

export const FiltersBar = memo(function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const tags = activeLabel(filters)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card rounded-xl px-4 py-3 flex flex-col gap-3"
    >
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="size-3.5" />
          Filters
        </div>

        {/* Date range */}
        <SelectWrapper icon={Calendar}>
          <select
            value={filters.dateRange}
            onChange={e => onChange({ ...filters, dateRange: e.target.value as DateRange })}
            className={selectClass}
          >
            {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </SelectWrapper>

        {/* Category */}
        <SelectWrapper icon={Tag}>
          <select
            value={filters.category}
            onChange={e => onChange({ ...filters, category: e.target.value as CategoryFilter })}
            className={selectClass}
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </SelectWrapper>

        {/* Region */}
        <SelectWrapper icon={MapPin}>
          <select
            value={filters.region}
            onChange={e => onChange({ ...filters, region: e.target.value as RegionFilter })}
            className={selectClass}
          >
            {REGION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </SelectWrapper>

        {/* Clear all */}
        {!isDefault(filters) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onChange({ dateRange: "all", category: "all", region: "all" })}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <X className="size-3" /> Clear
          </motion.button>
        )}
      </div>

      {/* Active filter tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
})
