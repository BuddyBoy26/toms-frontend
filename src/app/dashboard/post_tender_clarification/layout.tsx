import type { Metadata } from "next";
import PostTenderClarificationsPage from "./page";

export const metadata: Metadata = {
  title: "Post-Tender Clarifications", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <PostTenderClarificationsPage/>;
}