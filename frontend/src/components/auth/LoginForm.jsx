import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return form.identifier.trim().length > 0 && form.password.length > 0 && !loading;
  }, [form.identifier, form.password, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const res = await authApi.login(form.identifier, form.password);
      // NOTE: current app uses Zustand only (no localStorage). keep rememberMe for UX only.
      void rememberMe;
      setAuth(res.data.user, res.data.access_token);

      // Verify token works before navigating to protected route
      await authApi.me();
      navigate("/app/dashboard");
    } catch (err) {
      const e2 = err;
      const status = e2?.response?.status;
      const detail = e2?.response?.data?.detail;
      const msg =
        detail ??
        e2?.message ??
        "Login failed. Please try again.";

      setError(
        status
          ? `Login failed (HTTP ${status}): ${msg}`
          : `Login failed: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full h-full flex flex-col justify-center gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Sign in</h2>
          <div className="text-xs text-muted-foreground">Welcome back</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email or username</label>
          <input
            type="text"
            required
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            placeholder="Email or username"
            className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-[box-shadow,border-color]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm pr-10 transition-[box-shadow,border-color]"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-primary"
            />
            Remember me
          </label>

          <Link
            to="#"
            onClick={(e) => e.preventDefault()}
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold transition-transform transform-gpu hover:scale-[1.01] hover:opacity-95 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 border border-white/10"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Signing in..." : "Login"}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-2">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="text-primary hover:underline font-medium">
          Create account
        </Link>
      </div>
    </form>
  );
}

