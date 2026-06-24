import type { Metadata } from "next";
import PGListPage from "./page";

export const metadata: Metadata = {
  title: "PBGs", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <PGListPage/>;
}