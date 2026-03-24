import AuthFlowFooter from "@/components/AuthFlowFooter";

type AuthFlowShellProps = {
  children: React.ReactNode;
};

/**
 * Full-viewport column: centered main content + sticky institutional footer.
 */
export default function AuthFlowShell({ children }: AuthFlowShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-base-200 via-base-200 to-base-300/40">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 pb-20">
        <div className="flex w-full max-w-4xl flex-col items-center">{children}</div>
      </main>
      <AuthFlowFooter />
    </div>
  );
}
