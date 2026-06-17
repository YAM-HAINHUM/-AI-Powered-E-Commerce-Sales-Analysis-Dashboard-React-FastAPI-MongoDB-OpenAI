import AuthPage from "./AuthPage";

type Mode = "login" | "signup";

export default function LoginPage() {
  const initialMode: Mode = "login";
  return <AuthPage initialMode={initialMode} />;
}