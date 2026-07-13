import { getAdminMenu } from "@/lib/data";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { drinks, modifiers } = await getAdminMenu();

  return <MenuManager drinks={drinks} modifiers={modifiers} />;
}
