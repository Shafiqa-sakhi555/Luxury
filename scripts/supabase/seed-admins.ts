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

  // 2. Create Users & Assign Roles
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
