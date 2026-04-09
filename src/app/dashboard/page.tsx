import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { data: user } = await db.from("users")
    .select("name, company_id")
    .eq("id", session.user.id)
    .single() as { data: { name: string | null; company_id: string | null } | null };

  const companyId = user?.company_id ?? null;

  let inProgress = 0, todo = 0, blocked = 0, done = 0;

  if (companyId) {
    const { data: counts } = await db.from("issues")
      .select("status")
      .eq("company_id", companyId)
      .in("status", ["in_progress", "todo", "blocked", "done"]) as { data: { status: string }[] | null };

    for (const row of counts ?? []) {
      if (row.status === "in_progress") inProgress++;
      else if (row.status === "todo") todo++;
      else if (row.status === "blocked") blocked++;
      else if (row.status === "done") done++;
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Welcome back, {user?.name ?? session.user.email}
      </h1>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="In Progress" value={inProgress} color="blue" />
        <StatCard label="Todo" value={todo} color="gray" />
        <StatCard label="Blocked" value={blocked} color="red" />
        <StatCard label="Done" value={done} color="green" />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-50 text-gray-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className={`rounded-lg p-6 ${colors[color] ?? colors.gray}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
