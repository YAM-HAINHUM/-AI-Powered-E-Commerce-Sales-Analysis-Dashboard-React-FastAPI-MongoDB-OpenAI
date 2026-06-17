import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import {
  BarChart3, Brain, Zap, Shield, ChevronRight, Star,
  ArrowRight, LineChart, MessageSquare, Code2, Globe, Check,
  TrendingUp, Database, Sparkles,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/ThemeToggle"
import { AnimatedBubblesBackground } from "@/components/AnimatedBubblesBackground"

// ── Animation variants ────────────────────────────────────────────────────
const fadeUp: any = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: i * 0.08, 
      duration: 0.65, 
      ease: [0.22, 1, 0.36, 1] 
    } 
  }),
}
const stagger: any = { visible: { transition: { staggerChildren: 0.1 } } }

// ── Data ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Brain, title: "AI Business Insights", desc: "GPT-powered analysis explains sales performance in plain English and generates strategic recommendations.", color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.3)" },
  { icon: BarChart3, title: "Interactive Dashboards", desc: "Real-time KPI cards, revenue trends, category breakdowns, and top customer rankings in one unified view.", color: "from-indigo-500 to-blue-600", glow: "rgba(99,102,241,0.3)" },
  { icon: Code2, title: "Natural Language → SQL", desc: "Type plain English — watch it convert to live SQL and run instantly against your dataset.", color: "from-cyan-500 to-teal-600", glow: "rgba(6,182,212,0.3)" },
  { icon: LineChart, title: "Advanced Analytics", desc: "Monthly trends, running totals, window functions, and CTEs — all visualised with Recharts.", color: "from-emerald-500 to-green-600", glow: "rgba(16,185,129,0.3)" },
  { icon: MessageSquare, title: "AI Chat Assistant", desc: "Conversational interface for your data. Ask anything — revenue, churn, product trends.", color: "from-pink-500 to-rose-600", glow: "rgba(236,72,153,0.3)" },
  { icon: Shield, title: "Secure & Production-Ready", desc: "JWT auth, MongoDB Atlas, FastAPI backend with async drivers built for real workloads.", color: "from-amber-500 to-orange-600", glow: "rgba(245,158,11,0.3)" },
]

const STEPS = [
  { step: "01", icon: Database, title: "Connect Your Data", desc: "Upload CSV or use our pre-loaded sample e-commerce dataset to start in seconds." },
  { step: "02", icon: TrendingUp, title: "Explore & Analyze", desc: "Run SQL queries, view interactive charts, and drill into customer and product performance." },
  { step: "03", icon: Sparkles, title: "Get AI Insights", desc: "Let AI generate business recommendations, executive summaries, and strategic action plans." },
]

const STATS = [
  { val: 48320, prefix: "$", suffix: "", label: "Revenue Tracked" },
  { val: 342, prefix: "", suffix: "+", label: "Orders Processed" },
  { val: 98, prefix: "", suffix: "%", label: "Query Accuracy" },
  { val: 10, prefix: "", suffix: "x", label: "Faster Insights" },
]

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Head of E-Commerce, RetailCo", avatar: "SC", text: "The AI insights saved us 10 hours a week. It spotted a churn pattern we completely missed and the win-back campaign recovered $12K in revenue.", gradient: "from-violet-500 to-purple-600" },
  { name: "Marcus Rivera", role: "Data Analyst, ShopFlow", avatar: "MR", text: "The NLP-to-SQL feature is a game changer. Non-technical stakeholders can now query data themselves without bothering our data team.", gradient: "from-indigo-500 to-blue-500" },
  { name: "Priya Patel", role: "CTO, NexaStore", avatar: "PP", text: "Best dashboard I've seen for e-commerce analytics. The dark UI is gorgeous and the AI recommendations are surprisingly accurate.", gradient: "from-cyan-500 to-teal-500" },
  { name: "Alex Morgan", role: "VP Growth, Shopify brand", avatar: "AM", text: "Replaced three separate tools with this. The SQL engine + AI chat combo is incredibly powerful for our daily reporting.", gradient: "from-pink-500 to-rose-500" },
]

const PLANS = [
  { name: "Starter", price: "0", desc: "For solo analysts and side projects", features: ["5 SQL queries/day", "Dashboard overview", "Basic charts", "CSV export"], cta: "Start Free", highlighted: false },
  { name: "Pro", price: "29", desc: "For growing data teams", features: ["Unlimited SQL queries", "AI business insights", "NLP-to-SQL conversion", "AI chat assistant", "Real-time analytics", "Priority support"], cta: "Start Pro Trial", highlighted: true },
  { name: "Enterprise", price: "99", desc: "For large-scale operations", features: ["Everything in Pro", "Custom AI models", "SSO & advanced auth", "Dedicated infra", "SLA guarantee", "White-label option"], cta: "Contact Sales", highlighted: false },
]

const TECH = ["React 19", "FastAPI", "MongoDB", "SQLite", "OpenAI GPT-4", "Recharts", "Tailwind CSS", "JWT Auth", "Framer Motion", "TypeScript", "Vite", "Zustand"]

// ── Animated counter hook ─────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function StatCard({ val, prefix, suffix, label }: typeof STATS[0]) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = useCountUp(val, 1600, inView)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-black gradient-text-static">
        {prefix}{inView ? count.toLocaleString() : 0}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

// ── Parallax dashboard card ───────────────────────────────────────────────
function HeroDashboard() {
  const ref = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 10
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12
    setRotate({ x, y })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      initial={{ opacity: 0, y: 60, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
      className="relative w-full"
    >
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="glass-card rounded-2xl p-1"
        style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.2), 0 40px 80px rgba(99,102,241,0.15), 0 0 120px rgba(139,92,246,0.08)" }}
      >
        {/* Window chrome */}
        <div className="bg-[#0d1424] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex gap-1.5">
              {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} className="size-3 rounded-full" style={{ background: c }} />)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">DataInsight AI — Live Dashboard</div>
            <div className="flex gap-2">
              {["bg-indigo-500","bg-violet-500","bg-cyan-500"].map((c,i) => <div key={i} className={`size-1.5 rounded-full ${c} animate-pulse`} style={{ animationDelay: `${i*0.3}s` }} />)}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Revenue", val: "$48,320", change: "+18.3%", color: "text-emerald-400", icon: "💰" },
                { label: "Orders", val: "342", change: "+12.1%", color: "text-blue-400", icon: "📦" },
                { label: "Customers", val: "87", change: "+22.0%", color: "text-violet-400", icon: "👥" },
                { label: "Avg Order", val: "$284", change: "+5.6%", color: "text-amber-400", icon: "📈" },
              ].map((k) => (
                <div key={k.label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 hover:border-indigo-500/20 transition-colors">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">{k.icon} {k.label}</div>
                  <div className="text-base font-bold text-white mt-1">{k.val}</div>
                  <div className={`text-[10px] font-semibold ${k.color}`}>{k.change}</div>
                </div>
              ))}
            </div>

            {/* Chart + sidebar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                <div className="text-[11px] text-slate-400 mb-3 font-medium">Revenue Trend</div>
                <div className="flex items-end gap-1.5 h-24">
                  {[35,55,42,70,48,85,62,90,55,95,72,100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className="flex-1 rounded-t-sm"
                      style={{ background: `linear-gradient(180deg, ${i === 11 ? "#818cf8" : "#6366f1"} 0%, rgba(99,102,241,0.3) 100%)` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Jan","Mar","May","Jul","Sep","Nov"].map(m => <span key={m} className="text-[9px] text-slate-600">{m}</span>)}
                </div>
              </div>
              <div className="space-y-2">
                {[["Electronics","$18.2K","45%"],["Fashion","$12.1K","30%"],["Home","$10.0K","25%"]].map(([cat,rev,pct]) => (
                  <div key={cat} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5">
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-slate-400">{cat}</span>
                      <span className="text-white font-bold">{rev}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: pct }}
                        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI insight pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5"
            >
              <div className="size-6 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Brain className="size-3.5 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-300">
                <span className="text-indigo-400 font-semibold">AI Insight:</span> Electronics revenue is up 23% — consider bundling with accessories for upsell opportunities.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating accent cards */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-8 top-12 glass-card rounded-xl p-3 hidden lg:block"
        style={{ boxShadow: "0 8px 32px rgba(139,92,246,0.2)" }}
      >
        <div className="text-[10px] text-slate-400 mb-1">AI Score</div>
        <div className="text-xl font-black text-violet-400">94%</div>
        <div className="text-[9px] text-slate-500">Forecast accuracy</div>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -left-8 bottom-16 glass-card rounded-xl p-3 hidden lg:block"
        style={{ boxShadow: "0 8px 32px rgba(6,182,212,0.2)" }}
      >
        <div className="text-[10px] text-slate-400 mb-1">New Orders</div>
        <div className="text-xl font-black text-cyan-400">+47</div>
        <div className="text-[9px] text-emerald-400">↑ Last 24h</div>
      </motion.div>
    </motion.div>
  )
}

// ── Testimonial carousel ──────────────────────────────────────────────────
function TestimonialCarousel() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-2xl p-8 max-w-2xl mx-auto"
          style={{ boxShadow: "0 0 40px rgba(99,102,241,0.1)" }}
        >
          <div className="flex gap-1 mb-5">
            {Array(5).fill(0).map((_, j) => <Star key={j} className="size-4 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-lg text-slate-300 leading-relaxed mb-6">"{TESTIMONIALS[idx].text}"</p>
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-full bg-gradient-to-br ${TESTIMONIALS[idx].gradient} flex items-center justify-center text-white font-bold`}>
              {TESTIMONIALS[idx].avatar}
            </div>
            <div>
              <div className="font-semibold">{TESTIMONIALS[idx].name}</div>
              <div className="text-sm text-muted-foreground">{TESTIMONIALS[idx].role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-indigo-500" : "w-1.5 bg-white/20"}`} />
        ))}
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Reviews" },
  ]

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? `border-b backdrop-blur-2xl shadow-2xl ${
              isDark
                ? "border-white/[0.06] bg-[#0a0f1e]/90 shadow-black/30"
                : "border-slate-200/80 bg-white/90 shadow-slate-200/50"
            }`
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <BarChart3 className="size-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DataInsight <span className="gradient-text-static">AI</span></span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <a key={href} href={href}
              onMouseEnter={() => setHoveredLink(label)}
              onMouseLeave={() => setHoveredLink(null)}
              className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
              <motion.span
                className="absolute bottom-0.5 left-4 right-4 h-px bg-indigo-500 rounded-full"
                initial={false}
                animate={{ scaleX: hoveredLink === label ? 1 : 0, opacity: hoveredLink === label ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle showSystem />
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Sign in</Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/signup" className="text-sm px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all glow-primary">
              Get Started
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors ${
      isDark ? "bg-[#070b14] text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 min-h-[90vh] flex items-center overflow-hidden">
        {/* Advanced Background Animation */}
        <AnimatedBubblesBackground />
        
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
          {/* Radial vignette for depth */}
          <div className="absolute inset-0 bg-radial-[ellipse_80%_60%_at_50%_50%] from-transparent via-transparent to-[#070b14]/80" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Side: Content (50%) */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 backdrop-blur-sm">
                <Zap className="size-3.5 fill-indigo-400 text-indigo-400" />
                AI-Powered Analytics Platform
                <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
              </span>
            </motion.div>

            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
            >
              Turn Sales Data Into{" "}
              <span className="gradient-text block mt-1">AI-Driven Decisions</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-lg md:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed"
            >
              Advanced SQL analytics, interactive dashboards, and GPT-powered insights — all in one beautiful platform built for modern data teams.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }} whileTap={{ scale: 0.97 }}>
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl gradient-primary text-white font-bold text-lg glow-pulse">
                  Start Free <ArrowRight className="size-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all font-bold text-lg">
                  View Demo <ChevronRight className="size-5" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-sm text-slate-500"
            >
              {["No credit card required", "MIT Licensed", "Open source"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-500" />{t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right Side: Dashboard Preview (50%) */}
          <div className="w-full md:w-1/2 relative flex justify-center md:justify-end">
            <div className="relative z-10 w-full max-w-xl scale-95 md:scale-100 lg:scale-110 origin-center md:origin-right">
              <HeroDashboard />
            </div>
            {/* Soft background glow behind card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[300px] md:size-[400px] bg-indigo-600/20 blur-[100px] md:blur-[120px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── STATS BAND ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-black mb-5">
              Everything to <span className="gradient-text">analyze & grow</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">From raw SQL to AI-generated business strategy — one platform, zero friction.</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card rounded-2xl p-6 group cursor-default"
                style={{ "--glow": f.glow } as React.CSSProperties}
              >
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                  <f.icon className="size-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Process</span>
            <h2 className="text-4xl md:text-5xl font-black">Up and running in <span className="gradient-text">3 steps</span></h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative text-center group"
              >
                <div className="relative inline-flex">
                  <div className="size-16 rounded-2xl glass-card flex items-center justify-center mb-6 mx-auto group-hover:border-indigo-500/30 transition-colors"
                    style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.3)" }}>
                    <s.icon className="size-7 text-indigo-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full size-6 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="text-5xl font-black gradient-text-static opacity-10 mb-2 -mt-2">{s.step}</div>
                <h3 className="font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH MARQUEE ─────────────────────────────────────────────── */}
      <section className="py-12 px-6 border-y border-border overflow-hidden">
        <div className="flex gap-4 animate-marquee whitespace-nowrap w-max">
          {[...TECH, ...TECH].map((t, i) => (
            <span key={i} className="px-5 py-2 rounded-full border border-border bg-muted/40 text-sm font-medium text-muted-foreground shrink-0">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-black mb-5">Simple, <span className="gradient-text">transparent pricing</span></h2>
            <p className="text-slate-400 text-lg">Start free. Scale when you're ready.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`relative rounded-2xl p-7 flex flex-col ${plan.highlighted
                  ? "gradient-primary"
                  : "glass-card"
                }`}
                style={plan.highlighted ? { boxShadow: "0 0 60px rgba(99,102,241,0.35), 0 0 120px rgba(139,92,246,0.15)" } : {}}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-indigo-600 text-xs font-black uppercase tracking-wide shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <div className={`text-sm font-semibold mb-1 ${plan.highlighted ? "text-white/70" : "text-slate-400"}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-black ${plan.highlighted ? "text-white" : ""}`}>${plan.price}</span>
                    <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-slate-500"}`}>/mo</span>
                  </div>
                  <p className={`text-sm ${plan.highlighted ? "text-white/70" : "text-slate-400"}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className={`size-4 shrink-0 ${plan.highlighted ? "text-white" : "text-emerald-400"}`} />
                      <span className={plan.highlighted ? "text-white/90" : "text-slate-300"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.highlighted
                      ? "bg-white text-indigo-600 hover:bg-white/90"
                      : "border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/10 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section id="testimonials" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4 block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-black">Loved by <span className="gradient-text">data teams</span></h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <TestimonialCarousel />
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="max-w-3xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden p-12 text-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.08) 100%)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 80px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            <div className="blob size-64 bg-indigo-600/20 top-[-30%] left-[10%]" style={{ animationDelay: "0s" }} />
            <div className="blob size-48 bg-violet-600/15 bottom-[-20%] right-[10%]" style={{ animationDelay: "4s" }} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Ready to unlock your <span className="gradient-text">data's potential?</span>
              </h2>
              <p className="text-slate-400 mb-10 text-lg">Join data teams making smarter decisions with AI-powered analytics.</p>
              <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Link to="/signup" className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl gradient-primary text-white font-bold text-lg glow-pulse">
                  Get Started Free <ArrowRight className="size-5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl gradient-primary flex items-center justify-center">
              <BarChart3 className="size-4 text-white" />
            </div>
            <span className="font-bold">DataInsight <span className="gradient-text-static">AI</span></span>
          </div>
          <p className="text-sm text-slate-500">© 2024 DataInsight AI — Built with React, FastAPI & OpenAI</p>
          <div className="flex items-center gap-4 text-slate-500">
            <a href="#" className="hover:text-foreground transition-colors"><Globe className="size-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
