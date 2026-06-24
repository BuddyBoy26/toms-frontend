import type { Metadata } from "next";
import DiscrepancyListPage from "./page";

export const metadata: Metadata = {
  title: "Discrepancies", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <DiscrepancyListPage />;
}