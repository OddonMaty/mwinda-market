import { redirect } from "next/navigation";

export default function VendorFinancesRedirect() {
  redirect("/vendeur/dashboard?tab=finances");
}
