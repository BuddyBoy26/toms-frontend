import type { Metadata } from "next";
import CounterGuaranteeListPage from "./page";

export const metadata: Metadata = {
  title: "Counter Guarantees", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <CounterGuaranteeListPage />;
}