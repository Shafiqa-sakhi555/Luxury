import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listAdminShopStyles } from "@/server/shop-styles/queries";
import { ShopStyleManager } from "@/components/admin/catalog/ShopStyleManager";

export default async function AdminShopStylesPage() {
  await requireAdminPageAccess("catalog.write");
  const styles = await listAdminShopStyles().catch(() => []);

  return <ShopStyleManager styles={styles} />;
}
