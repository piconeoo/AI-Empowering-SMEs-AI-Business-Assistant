import { generateSalesAssistantDraft } from "@/lib/business";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const need = typeof body.need === "string" ? body.need.trim() : "";

  if (need.length < 8) {
    return Response.json(
      { message: "客户需求至少需要 8 个字符。" },
      { status: 400 }
    );
  }

  return Response.json(generateSalesAssistantDraft(need));
}
