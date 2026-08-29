import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LogoMark } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <LogoMark size={64} className="drop-shadow-[0_0_24px_rgba(45,251,224,0.4)]" />
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-white">Daily</span>
            <span className="bg-accent-gradient bg-clip-text text-transparent">Flow</span>
          </h1>
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
