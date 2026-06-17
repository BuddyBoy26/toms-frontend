import type { Metadata } from "next";
import LotMonitoringPage from "./page";

export const metadata: Metadata = {
  title: "Lots", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <LotMonitoringPage/>;
}