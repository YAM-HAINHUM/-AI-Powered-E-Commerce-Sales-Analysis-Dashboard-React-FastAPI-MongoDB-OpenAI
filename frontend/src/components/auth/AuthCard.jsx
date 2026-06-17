import { useEffect, useMemo, useRef, useState } from "react";

export default function AuthCard({ mode, onToggle, marketing, loginForm, signupForm }) {
  const cardRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => setReduceMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const rotationClass = useMemo(() => {
    return isLogin ? "auth-rot-0" : "auth-rot-180";
  }, [isLogin]);

  return (
    <div className="relative w-full max-w-5xl">
      <div
        ref={cardRef}
        className={
          "auth-wrap group relative rounded-3xl " +
          "border border-indigo-500/20 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(99,102,241,0.12)] overflow-hidden"
        }
      >
        {/* Mobile: stack + tabs (no flip) */}
        <div className="md:hidden px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">DataInsight AI</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggle}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-indigo-500/20 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15 transition"
              >
                {isLogin ? "Sign up" : "Login"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isLogin) onToggle();
              }}
              className={
                "flex-1 py-2 rounded-2xl text-xs font-semibold border transition " +
                (isLogin
                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-100"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/10")
              }
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLogin) onToggle();
              }}
              className={
                "flex-1 py-2 rounded-2xl text-xs font-semibold border transition " +
                (!isLogin
                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-100"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/10")
              }
            >
              Signup
            </button>
          </div>
        </div>

        {/* Desktop: flip card */}
        <div className="hidden md:block">
          <div className="auth-perspective">
            <div className={`auth-card-3d ${reduceMotion ? "auth-no-anim" : ""} ${rotationClass}`}>
                  <div className="auth-face auth-face-front">
                <div className="auth-face-grid">
                  <div className="auth-panel auth-panel-left">{marketing}</div>
                  <div className="auth-panel auth-panel-right">{loginForm}</div>
                </div>
              </div>

              <div className="auth-face auth-face-back">
                <div className="auth-face-grid">
                  <div className="auth-panel auth-panel-left">{signupForm}</div>
                  <div className="auth-panel auth-panel-right">{marketing}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={onToggle}
              className="px-3 py-2 rounded-2xl text-xs font-semibold border border-white/10 bg-white/5 text-slate-200 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition"
            >
              {isLogin ? "Switch to Sign Up" : "Switch to Login"}
            </button>
          </div>
        </div>

        {/* Mobile content (no flip) */}
        <div className="md:hidden p-5">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">{marketing}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
              {isLogin ? loginForm : signupForm}
            </div>
          </div>
        </div>

        <div className="auth-glow" aria-hidden />
      </div>

      <style>{`
        .auth-perspective { perspective: 1300px; }

        .auth-card-3d {
          position: relative;
          width: 100%;
          min-height: 560px;
          transform-style: preserve-3d;
          transition: transform 0.75s ease-in-out;
          will-change: transform;
        }

        .auth-no-anim { transition: none !important; }

        .auth-rot-0 { transform: rotateY(0deg); }
        .auth-rot-180 { transform: rotateY(180deg); }

        .auth-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-face-front {
          transform: rotateY(0deg);
        }

        .auth-face-back {
          transform: rotateY(180deg);
        }

        .auth-face-grid {
          width: 100%;
          height: 100%;
          display: flex;
          gap: 2rem;
          align-items: stretch;
          justify-content: stretch;
        }

        .auth-panel {
          width: 50%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2rem;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
        }

        .auth-panel-left {
          padding-right: 1.5rem;
        }

        .auth-panel-right {
          padding-left: 1.5rem;
        }

        .auth-panel-back-right {
          order: 2;
        }

        .auth-panel-back-left {
          order: 1;
        }

        @media (max-width: 1024px) {
          .auth-face-grid {
            flex-direction: column;
          }
          .auth-panel {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .auth-card-3d {
            min-height: auto;
            transform: none !important;
          }
          .auth-face {
            position: static;
            padding: 0;
          }
        }

        .auth-glow {
          position: absolute;
          inset: -2px;
          background: radial-gradient(500px circle at 15% 10%, rgba(168,85,247,0.18), transparent 40%),
                      radial-gradient(500px circle at 85% 90%, rgba(59,130,246,0.16), transparent 45%);
          pointer-events: none;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

