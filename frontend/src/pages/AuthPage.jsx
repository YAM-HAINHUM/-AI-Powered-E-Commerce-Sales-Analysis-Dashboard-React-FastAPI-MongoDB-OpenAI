import { useMemo, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

export default function AuthPage({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");

  const isLogin = mode === "login";

  const marketingContent = useMemo(
    () => (
      <div className="h-full flex flex-col items-start justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl gradient-primary flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.35)]">
            <span className="text-white font-black">DI</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground/90">DataInsight AI</div>
            <div className="text-xs text-muted-foreground">AI-powered analytics dashboard</div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Unlock Powerful Insights
          </h1>
          <p className="text-muted-foreground mt-3 max-w-[32ch]">
            Analyze your business with AI-driven intelligence—faster decisions, cleaner metrics, smarter recommendations.
          </p>
        </div>

        <div className="w-full">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.25),transparent_45%)]" />
            <div className="relative grid gap-2">
              <div className="flex items-center gap-2 text-sm text-foreground/90">
                <span className="inline-flex size-7 items-center justify-center rounded-xl bg-white/5 border border-white/10">✓</span>
                AI insights & anomaly detection
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/90">
                <span className="inline-flex size-7 items-center justify-center rounded-xl bg-white/5 border border-white/10">✓</span>
                Revenue trends, forecasts, recommendations
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/90">
                <span className="inline-flex size-7 items-center justify-center rounded-xl bg-white/5 border border-white/10">✓</span>
                Real-time dashboards & export-ready reports
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Premium SaaS-grade authentication experience with smooth 3D transitions.
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-[conic-gradient(from_210deg,rgba(168,85,247,0.18),rgba(59,130,246,0.18),rgba(99,102,241,0.18))] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl">
        <AuthCard
          mode={mode}
          onToggle={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          marketing={marketingContent}
          loginForm={<LoginForm />}
          signupForm={<SignupForm />}
        />
      </div>
    </div>
  );
}

