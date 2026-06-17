import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function SignupForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "", dob: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ageValid = useMemo(() => {
    if (!form.dob) return false;
    const dobDate = new Date(form.dob);
    if (Number.isNaN(dobDate.getTime())) return false;
    const diff = Date.now() - dobDate.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return age >= 21;
  }, [form.dob]);

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim().length > 0 &&
      form.username.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      form.password === form.confirmPassword &&
      ageValid &&
      !loading
    );
  }, [form, ageValid, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!ageValid) {
      setError("You must be at least 21 years old to create an account.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Backend expects: username, email, password, full_name
      const res = await authApi.signup(
        form.username,
        form.email,
        form.password,
        form.fullName
      );
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
        "Signup failed. Please try again.";

      setError(
        status
          ? `Signup failed (HTTP ${status}): ${msg}`
          : `Signup failed: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full h-full flex flex-col justify-center gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Create account</h2>
          <div className="text-xs text-muted-foreground">Start free</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full name</label>
            <input
              type="text"
              required
              minLength={2}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-[box-shadow,border-color]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <input
              type="text"
              required
              minLength={3}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="john_doe"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-[box-shadow,border-color]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-[box-shadow,border-color]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Date of birth</label>
            <input
              type="date"
              required
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-[box-shadow,border-color]"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters"
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

        <div>
          <label className="text-sm font-medium mb-1.5 block">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Repeat your password"
            className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-[box-shadow,border-color]"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {!ageValid && form.dob && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/20">
            You must be at least 21 years old to create an account.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold transition-transform transform-gpu hover:scale-[1.01] hover:opacity-95 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 border border-white/10"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Creating..." : "Sign up"}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-2">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Login
        </Link>
      </div>
    </form>
  );
}

