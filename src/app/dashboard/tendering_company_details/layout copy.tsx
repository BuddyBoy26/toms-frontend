import type { Metadata } from "next";
import TenderingCompaniesListPage from "./page";

export const metadata: Metadata = {
  title: "Tendering Companies Details", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <TenderingCompaniesListPage/>;
}