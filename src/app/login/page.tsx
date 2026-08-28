import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Logo width={280} className="drop-shadow-[0_0_28px_rgba(45,251,224,0.25)]" />
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
