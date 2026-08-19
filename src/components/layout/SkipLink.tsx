import Link from "next/link";

export function SkipLink({ href = "#main-content" }: { href?: string }) {
  return (
    <Link href={href} className="skip-link">
      Skip to main content
    </Link>
  );
}
