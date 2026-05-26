import { normalizeKnowledgeItem, summarizeKnowledgeBase } from "@/lib/business";
import { mockKnowledgeItems } from "@/lib/mock-data";

export function GET() {
  return Response.json({
    items: mockKnowledgeItems,
    summary: summarizeKnowledgeBase(mockKnowledgeItems),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (title.length < 2) {
    return Response.json({ message: "资料标题至少需要 2 个字符。" }, { status: 400 });
  }

  if (content.length < 8) {
    return Response.json({ message: "资料内容至少需要 8 个字符。" }, { status: 400 });
  }

  return Response.json(normalizeKnowledgeItem(body), { status: 201 });
}
