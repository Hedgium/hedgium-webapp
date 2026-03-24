import Link from "next/link";

type AuthFlowBrandProps = {
  /** Override default bottom margin (e.g. `mb-0` when inside a spaced header stack). */
  className?: string;
};

export default function AuthFlowBrand({ className = "mb-5" }: AuthFlowBrandProps) {
  return (
    <Link
      href="/"
      className={`block rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hedgium_icon.png"
        alt="Hedgium"
        className="mx-auto h-9 w-auto sm:h-12"
      />
    </Link>
  );
}
