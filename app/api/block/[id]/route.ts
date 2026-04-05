import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/adminAuth";

/**
 * PATCH /api/block/[id]
 * Update a block
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, label, content, orderIndex, parentId } = body;

    let numericValue: number | undefined = undefined;
    let operator: string | undefined = undefined;

    if (type === "number_rule" && content) {
      numericValue = content.value;
      operator = content.operator;
    }

    const updatedBlock = await prisma.policyBlock.update({
      where: { id },
      data: {
        type: type !== undefined ? type : undefined,
        label: label !== undefined ? label : undefined,
        content: content !== undefined ? content : undefined,
        orderIndex: orderIndex !== undefined ? orderIndex : undefined,
        parentId: parentId !== undefined ? parentId : undefined,
        numericValue,
        operator,
      },
    });

    return NextResponse.json({ success: true, data: updatedBlock });
  } catch (error: any) {
    console.error("Error updating block:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/block/[id]
 * Delete a block
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.policyBlock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: "Block deleted" } });
  } catch (error: any) {
    console.error("Error deleting block:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
