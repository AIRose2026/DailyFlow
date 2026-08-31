import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { BottomNav } from "./BottomNav";

export function AppShell({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  return (
    <>
      <div className="app-scroll pb-28">
        <div className="relative">
          {/* Decorative glow with a fixed height independent of the header's
              own (content-driven) height, so the teal fades out gradually
              well past the header's bottom edge instead of cutting off hard
              exactly where the header box ends. */}
          <div className="page-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
          {header}
          <main className="mx-auto max-w-md px-4 pt-4">{children}</main>
        </div>
      </div>
      <FeedbackButton />
      <BottomNav />
    </>
  );
}
