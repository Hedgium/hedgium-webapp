import AuthFlowThemeToggle from "@/components/AuthFlowThemeToggle";

/**
 * Skip navigation + theme toggle for auth flow pages.
 */
export default function AuthFlowChrome() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-end p-4 print:hidden">
        <div className="pointer-events-auto">
          <AuthFlowThemeToggle />
        </div>
      </div>
    </>
  );
}
