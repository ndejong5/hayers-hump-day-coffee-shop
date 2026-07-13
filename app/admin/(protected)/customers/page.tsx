import { getCustomersForPhotos } from "@/lib/data";
import { CustomersManager } from "@/components/admin/CustomersManager";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomersForPhotos();
  return <CustomersManager customers={customers} />;
}
