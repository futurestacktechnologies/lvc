import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="text-2xl font-bold tracking-tight">
      Enfield
      <span className="text-brand bg-gradient-to-r from-brand to-indigo-400 bg-clip-text text-transparent">
        Nexus
      </span>
    </Link>
  );
}
