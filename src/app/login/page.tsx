import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
            <span className="text-2xl font-bold text-base-950">DF</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DailyFlow</h1>
          <p className="text-center text-sm text-white/50">
            Deine Aufgaben, Routinen und E-Mail-To-dos an einem Ort.
          </p>
        </div>

        <div className="glass-card p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
