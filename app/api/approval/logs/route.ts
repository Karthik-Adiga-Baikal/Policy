import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const logs = await prisma.executionLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        approvalQueue: {
          include: {
            policyEngine: {
              select: {
                name: true,
                version: true,
              },
            },
            reviewer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      policyId: log.approvalQueue.policyEngineId,
      policyName: log.approvalQueue.policyEngine.name,
      policyVersion: log.approvalQueue.policyEngine.version,
      decision: log.status,
      notes: `${log.ruleName} | input: ${log.inputValue} | threshold: ${log.thresholdUsed}`,
      checkerName: log.approvalQueue.reviewer?.name || "Unknown",
      checkerEmail: log.approvalQueue.reviewer?.email || null,
      createdAt: log.createdAt,
    }));

    return NextResponse.json(
      new ApiResponse(200, "Execution logs fetched successfully", formattedLogs, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
