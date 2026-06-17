import AuthPage from "./AuthPage";

type Mode = "login" | "signup";

export default function SignupPage() {
  const initialMode: Mode = "signup";
  return <AuthPage initialMode={initialMode} />;
}
