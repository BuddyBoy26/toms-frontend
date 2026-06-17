import type { Metadata } from "next";
import CompanyListPage from "./page";

export const metadata: Metadata = {
  title: "Company Master", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <CompanyListPage />;
}