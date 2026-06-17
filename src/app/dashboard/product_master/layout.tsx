import type { Metadata } from "next";
import ProductListPage from "./page";

export const metadata: Metadata = {
  title: "Product Master", // Browser tab will show: "Dashboard | KKA Portal"
};

export default function DashboardPage() {
  return <ProductListPage/>;
}