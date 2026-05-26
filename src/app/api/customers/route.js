import { mockCustomers } from "@/lib/mock-data";

export function GET() {
  return Response.json(mockCustomers);
}
