import type { Metadata } from "next";
import DrawingListPage from "./page";

export const metadata: Metadata = {
  title: "Drawing Details", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <DrawingListPage />;
}