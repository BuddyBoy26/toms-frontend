import type { Metadata } from "next";
import OrderDetailsListPage from "./page";

export const metadata: Metadata = {
  title: "Purchase Orders", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <OrderDetailsListPage/>;
}