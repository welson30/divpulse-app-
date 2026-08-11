import type { Metadata } from "next";
import { HelpBoard } from "@/components/dashboard/help/help-board";

export const metadata: Metadata = {
  title: "Help center — PaidPrime",
};

export default function HelpPage() {
  return <HelpBoard />;
}
