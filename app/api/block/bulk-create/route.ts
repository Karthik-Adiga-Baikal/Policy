import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/adminAuth";

/**
 * POST /api/block/bulk-create
 * Create multiple blocks at once (for AI import)
 */
export async function POST(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { policyId, blocks } = body;

    if (!policyId || !Array.isArray(blocks)) {
      return NextResponse.json(
        { success: false, error: "policyId and blocks array are required" },
        { status: 400 }
      );
    }

    const createdBlocks = await Promise.all(
      blocks.map(async (blockData: any) => {
        let numericValue: number | undefined = undefined;
        let operator: string | undefined = undefined;

        if (blockData.type === "number_rule" && blockData.content) {
          numericValue = blockData.content.value;
          operator = blockData.content.operator;
        }

        return prisma.policyBlock.create({
          data: {
            policyId,
            type: blockData.type,
            label: blockData.label || null,
            content: blockData.content,
            orderIndex: blockData.orderIndex,
            parentId: blockData.parentId || null,
            numericValue,
            operator,
          },
        });
      })
    );

    return NextResponse.json({ success: true, data: createdBlocks });
  } catch (error: any) {
    console.error("Error bulk creating blocks:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
