import Link from "next/link";
import ScheduledTasks from "@/components/admin/ScheduledTasks";

export default function AdminPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
            <ScheduledTasks />
        </div>
    );
}