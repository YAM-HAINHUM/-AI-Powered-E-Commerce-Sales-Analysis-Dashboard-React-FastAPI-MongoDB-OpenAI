/**
 * uploadStore — persisted Zustand store for processed upload datasets.
 * Any page can call `useUploadStore(s => s.dataset)` to read the last
 * processed dataset without modifying those pages at all.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Detected column ───────────────────────────────────────────────────────────
export type SemanticField =
  | "revenue" | "orders" | "customers" | "date" | "category"
  | "product" | "region" | "quantity" | "price" | "customer_id"
  | "order_id" | "ignore";

export interface DetectedColumn {
  raw: string;
  mapped: SemanticField;
  type: "numeric" | "date" | "text" | "unknown";
  nullCount: number;
  nullPct: number;
  uniqueCount: number;
  sample: string[];
}

// ── Validation issue ──────────────────────────────────────────────────────────
export interface ValidationIssue {
  col: string;
  kind: "missing" | "duplicate" | "type_mismatch" | "out_of_range";
  count: number;
  message: string;
  severity: "error" | "warning" | "info";
}

// ── Processed dataset ─────────────────────────────────────────────────────────
export interface ProcessedDataset {
  id: string;
  filename: string;
  format: "csv" | "xlsx" | "json";
  uploadedAt: string;
  totalRows: number;
  cleanRows: number;
  totalCols: number;
  fileSizeKb: number;
  columns: DetectedColumn[];
  issues: ValidationIssue[];
  duplicatesRemoved: number;
  nullsFilled: number;
  qualityScore: number;
  aiSummary: string;
  preview: Record<string, unknown>[];
  kpis: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    avg_order_value: number;
    revenue_growth: number;
    orders_growth: number;
  };
  monthly_trend: { month: string; revenue: number; orders: number }[];
  category_revenue: { category: string; revenue: number }[];
  top_products: { name: string; units: number }[];
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface UploadState {
  dataset: ProcessedDataset | null;
  setDataset: (d: ProcessedDataset) => void;
  clear: () => void;
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      dataset: null,
      setDataset: (d) => set({ dataset: d }),
      clear: () => set({ dataset: null }),
    }),
    {
      name: "di-upload-dataset",
      partialize: (s) => ({
        dataset: s.dataset
          ? { ...s.dataset, preview: s.dataset.preview.slice(0, 20) }
          : null,
      }),
    }
  )
);
