import type { Metadata } from "next";
import TenderListPage from "./page";

export const metadata: Metadata = {
  title: "Tenders", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <TenderListPage/>;
}