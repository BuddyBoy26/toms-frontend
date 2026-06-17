import type { Metadata } from "next";
import DeliveryProcedurePage from "./page";

export const metadata: Metadata = {
  title: "Delivery Procedures", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <DeliveryProcedurePage />;
}