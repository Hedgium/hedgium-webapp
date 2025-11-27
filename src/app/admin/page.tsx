import Link from "next/link";

export default function AdminPage() {
    return <div className="text-center flex flex-col gap-2 p-2">
        <Link href="/admin/strategy">Strategies</Link>
        <Link href="/admin/profiles">Profiles</Link>
    </div>;
}