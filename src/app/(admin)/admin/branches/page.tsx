import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listAdminStores } from "@/server/stores/queries";
import { BranchManager } from "@/components/admin/catalog/BranchManager";

export default async function AdminBranchesPage() {
  await requireAdminPageAccess("catalog.write");
  const branches = await listAdminStores().catch(() => []);

  return <BranchManager branches={branches} />;
}
