import type { Metadata } from "next";
import GuaranteesDashboard from "./page";

export const metadata: Metadata = {
  title: "Guarantees", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <GuaranteesDashboard/>;
}