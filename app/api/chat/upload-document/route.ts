import { NextRequest, NextResponse } from "next/server";
import { buildBackendAiUrl } from "@/lib/backendAiUrl";

export async function POST(request: NextRequest) {
    try {
        // Forward the raw multipart form to the crewai-agent
        const formData = await request.formData();
        
        const response = await fetch(buildBackendAiUrl("/api/chat/upload-document"), {
            method: "POST",
            body: formData,
            // Do NOT set Content-Type — fetch sets it automatically with the boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Upload failed" }));
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Upload proxy error:", error);
        return NextResponse.json(
            { detail: "Could not connect to document processor. Check BACKEND_AI_URL/NEXT_PUBLIC_BACKEND_AI_URL." },
            { status: 502 }
        );
    }
}
