import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/adminAuth";

/**
 * PATCH /api/block/reorder
 * Reorder blocks by updating orderIndex
 */
export async function PATCH(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { blocks } = body;

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { success: false, error: "blocks array is required" },
        { status: 400 }
      );
    }

    const updatedBlocks = await Promise.all(
      blocks.map((item: any) =>
        prisma.policyBlock.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true, data: updatedBlocks });
  } catch (error: any) {
    console.error("Error reordering blocks:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
