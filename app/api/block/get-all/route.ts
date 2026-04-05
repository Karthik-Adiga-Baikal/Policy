import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/adminAuth";

/**
 * GET /api/block/get-all?policyId=xxx
 * Fetch all blocks for a policy, ordered by orderIndex
 */
export async function GET(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get("policyId");

    if (!policyId) {
      return NextResponse.json(
        { success: false, error: "policyId query parameter is required" },
        { status: 400 }
      );
    }

    const blocks = await prisma.policyBlock.findMany({
      where: { policyId },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ success: true, data: blocks });
  } catch (error: any) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
