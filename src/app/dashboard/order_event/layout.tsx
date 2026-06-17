import type { Metadata } from "next";
import OrderEventListPage from "./page";

export const metadata: Metadata = {
  title: "PO Events", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <OrderEventListPage/>;
}