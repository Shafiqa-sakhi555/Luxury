import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rolesToCreate = [
  { name: 'Super Admin', description: 'Full access to everything' },
  { name: 'Admin', description: 'Access to manage catalog and orders' },
  { name: 'Finance', description: 'Access to financial reports and billing' },
  { name: 'Customer', description: 'Standard customer role' },
];

const permissionsToCreate = [
  { key: '*', description: 'All permissions' },
  { key: 'catalog.write', description: 'Create and update catalog categories' },
  { key: 'catalog.delete', description: 'Delete catalog categories' },
  { key: 'category.write', description: 'Create and update categories' },
  { key: 'product.write', description: 'Create and update products' },
  { key: 'product.delete', description: 'Delete products' },
  { key: 'order.read', description: 'View orders' },
  { key: 'order.write', description: 'Update orders' },
  { key: 'customer.read', description: 'View customers' },
  { key: 'inventory.read', description: 'View inventory' },
  { key: 'inventory.write', description: 'Adjust inventory' },
  { key: 'finance.read', description: 'View finance reports' },
  { key: 'finance.dashboard.view', description: 'View finance dashboard' },
  { key: 'transactions.view', description: 'View financial transactions' },
  { key: 'payments.view', description: 'View payments' },
  { key: 'refunds.view', description: 'View refund requests' },
  { key: 'refunds.create', description: 'Create refund requests' },
  { key: 'refunds.approve', description: 'Approve refund requests' },
  { key: 'refunds.reject', description: 'Reject refund requests' },
  { key: 'invoices.view', description: 'View invoices' },
  { key: 'invoices.download', description: 'Download invoices' },
  { key: 'payouts.view', description: 'View payouts' },
  { key: 'settlements.view', description: 'View settlements' },
  { key: 'reconciliation.view', description: 'View reconciliation' },
  { key: 'reconciliation.manage', description: 'Manage reconciliation' },
  { key: 'financial_reports.view', description: 'View financial reports' },
  { key: 'financial_reports.export', description: 'Export financial reports' },
];

const rolePermissionMap: Record<string, string[]> = {
  'Super Admin': ['*'],
  Admin: [
    'catalog.write',
    'catalog.delete',
    'category.write',
    'product.write',
    'product.delete',
    'order.read',
    'order.write',
    'customer.read',
    'inventory.read',
    'inventory.write',
    'refunds.create',
    'refunds.view',
    'invoices.view',
  ],
  Finance: [
    'order.read',
    'finance.read',
    'finance.dashboard.view',
    'transactions.view',
    'payments.view',
    'refunds.view',
    'refunds.approve',
    'refunds.reject',
    'invoices.view',
    'invoices.download',
    'payouts.view',
    'settlements.view',
    'reconciliation.view',
    'reconciliation.manage',
    'financial_reports.view',
    'financial_reports.export',
    'customer.read',
  ],
};

const usersToCreate = [
  { email: 'superadmin@jalals.com', password: 'Password123!', name: 'Super Admin', role: 'Super Admin' },
  { email: 'admin@jalals.com', password: 'Password123!', name: 'Store Admin', role: 'Admin' },
  { email: 'finance@jalals.com', password: 'Password123!', name: 'Finance Manager', role: 'Finance' },
];

async function seed() {
  console.log('Seeding roles and admin users...');

  // 1. Ensure Roles Exist
  for (const role of rolesToCreate) {
    const { error } = await supabase
      .from('roles')
      .upsert({ name: role.name, description: role.description }, { onConflict: 'name' });
    
    if (error) {
      console.error(`Error creating role ${role.name}:`, error.message);
    } else {
      console.log(`Role ensured: ${role.name}`);
    }
  }

  // 2. Ensure Permissions Exist
  for (const permission of permissionsToCreate) {
    const { error } = await supabase
      .from('permissions')
      .upsert({ key: permission.key, description: permission.description }, { onConflict: 'key' });

    if (error) {
      console.error(`Error creating permission ${permission.key}:`, error.message);
    } else {
      console.log(`Permission ensured: ${permission.key}`);
    }
  }

  // 3. Link Roles to Permissions
  for (const [roleName, permissionKeys] of Object.entries(rolePermissionMap)) {
    const { data: roleData } = await supabase.from('roles').select('id').eq('name', roleName).single();
    if (!roleData) continue;

    for (const permissionKey of permissionKeys) {
      const { data: permissionData } = await supabase
        .from('permissions')
        .select('id')
        .eq('key', permissionKey)
        .single();

      if (!permissionData) continue;

      const { error } = await supabase.from('role_permissions').upsert(
        { role_id: roleData.id, permission_id: permissionData.id },
        { onConflict: 'role_id,permission_id' }
      );

      if (error) {
        console.error(`Error linking ${roleName} -> ${permissionKey}:`, error.message);
      }
    }

    console.log(`Permissions linked for role: ${roleName}`);
  }

  // 4. Create Users & Assign Roles
  for (const u of usersToCreate) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId = existingUsers?.users.find((user) => user.email === u.email)?.id;

    if (!userId) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
        app_metadata: { role: u.role },
      });

      if (createError) {
        console.error(`Error creating user ${u.email}:`, createError.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`User created: ${u.email}`);
    } else {
      console.log(`User already exists: ${u.email}`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { name: u.name },
        app_metadata: { role: u.role },
      });

      if (updateError) {
        console.error(`Error updating metadata for ${u.email}:`, updateError.message);
      } else {
        console.log(`Metadata updated: ${u.email}`);
      }
    }

    // Assign Role
    const { data: roleData } = await supabase.from('roles').select('id').eq('name', u.role).single();
    
    if (roleData && userId) {
      const { error: roleError } = await supabase.from('user_roles').upsert(
        { user_id: userId, role_id: roleData.id },
        { onConflict: 'user_id,role_id' }
      );

      if (roleError) {
        console.error(`Error assigning role to ${u.email}:`, roleError.message);
      } else {
        console.log(`Role '${u.role}' assigned to ${u.email}`);
      }
    }
  }

  console.log('\n✅ Seeding complete! You can now log in with the generated accounts.');
}

seed();
