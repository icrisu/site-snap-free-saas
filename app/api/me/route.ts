import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEffectiveLimits } from "@/lib/billing/get-effective-limits";
import { getUsage } from "@/lib/billing/get-usage";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [limits, usage] = await Promise.all([
      getEffectiveLimits(session.user.id),
      getUsage(session.user.id),
    ]);

    return NextResponse.json({ limits, usage });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}
