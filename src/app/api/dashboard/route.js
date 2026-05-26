import { summarizeDashboard } from "@/lib/business";
import { dashboardActionItems, mockCustomers } from "@/lib/mock-data";

export function GET() {
  return Response.json(summarizeDashboard(mockCustomers, dashboardActionItems));
}
