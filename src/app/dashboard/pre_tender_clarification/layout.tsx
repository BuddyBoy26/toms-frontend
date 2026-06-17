import type { Metadata } from "next";
import PreTenderClarificationsPage from "./page";

export const metadata: Metadata = {
  title: "Pre-Tender Clarifications", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <PreTenderClarificationsPage/>;
}