import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="text-2xl font-bold tracking-tight">
      Auto<span className="text-brand">Nippon</span>
    </Link>
  );
}
