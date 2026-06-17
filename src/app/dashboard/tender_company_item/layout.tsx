import TenderingCompaniesListPage from "./page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tendering Company Items", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <TenderingCompaniesListPage/>;
}