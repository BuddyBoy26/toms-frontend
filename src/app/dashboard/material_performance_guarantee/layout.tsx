import type { Metadata } from "next";
import MPGListPage from "./page";

export const metadata: Metadata = {
  title: "MPGs", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <MPGListPage/>;
}