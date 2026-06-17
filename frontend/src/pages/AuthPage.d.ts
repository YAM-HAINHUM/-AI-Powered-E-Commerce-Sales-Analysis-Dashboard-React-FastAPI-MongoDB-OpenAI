export {};

declare module "./AuthPage" {
  import type React from "react";

  export interface AuthPageProps {
    initialMode?: "login" | "signup";
  }

  const AuthPage: React.FC<AuthPageProps>;
  export default AuthPage;
}


