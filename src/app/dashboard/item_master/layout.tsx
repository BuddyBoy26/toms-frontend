import type { Metadata } from "next";
import ItemListPage from "./page";

export const metadata: Metadata = {
  title: "Item Master", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <ItemListPage/>;
}