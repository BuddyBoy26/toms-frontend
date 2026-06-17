import type { Metadata } from "next";
import OrderItemListPage from "./page";

export const metadata: Metadata = {
  title: "Order Items Details", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <OrderItemListPage/>;
}