import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/adminAuth";

/**
 * POST /api/block/create
 * Create a single block
 */
export async function POST(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { policyId, type, label, content, orderIndex, parentId } = body;

    if (!policyId || !type || content === undefined || orderIndex === undefined) {
      return NextResponse.json(
        { success: false, error: "policyId, type, content, and orderIndex are required" },
        { status: 400 }
      );
    }

    // Extract numeric value and operator for number_rule type
    let numericValue: number | undefined = undefined;
    let operator: string | undefined = undefined;

    if (type === "number_rule" && content) {
      numericValue = content.value;
      operator = content.operator;
    }

    const block = await prisma.policyBlock.create({
      data: {
        policyId,
        type,
        label: label || null,
        content,
        orderIndex,
        parentId: parentId || null,
        numericValue,
        operator,
      },
    });

    return NextResponse.json({ success: true, data: block });
  } catch (error: any) {
    console.error("Error creating block:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
