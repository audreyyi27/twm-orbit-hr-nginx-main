import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { BASE_URL } from "@/core/utils/constant/base";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ project_id: string }> }) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const { project_id } = await params;
    const projectId = project_id?.replace(/[<>\s]/g, "");
    const url = `${BASE_URL}/projects/${projectId}/update`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try {
        const parsed = JSON.parse(text);
        detail = parsed.detail || parsed.message || text;
      } catch {}
      return new Response(JSON.stringify({ detail }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json().catch(() => null);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ detail: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
