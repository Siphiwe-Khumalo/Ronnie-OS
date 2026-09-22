#!/usr/bin/env node
/**
 * Alerta demo data seeder.
 *
 * Creates a realistic demo business ("Mandla Construction") with one
 * manager and four employees, plus some historical shifts, a resolved
 * incident, and a resolved SOS event so the dashboard/stats views have
 * something meaningful to show on first login.
 *
 * This script is a DEVELOPMENT/DEMO convenience only. It is never run in
 * production and never bundled into the frontend. It requires the
 * Supabase **service role** key, which must never be exposed to a
 * browser — that's exactly why this lives in a standalone Node script
 * instead of application code.
 *
 * Required environment variables (see supabase/seed/.env.seed.example):
 *   SUPABASE_URL              — same project URL as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — Project Settings > API > service_role
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed/seed.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.ALERTA_DEMO_PASSWORD || 'AlertaDemo123!';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\nMissing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in your shell (never commit the service role key) and re-run:\n\n' +
      '  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node supabase/seed/seed.mjs\n'
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_DOMAIN = 'alerta.demo';

const PEOPLE = [
  { name: 'Sarah Mthembu', email: `sarah.manager@${DEMO_DOMAIN}`, role: 'manager', phone: '+27 82 100 1001' },
  { name: 'Thabo Mokoena', email: `thabo@${DEMO_DOMAIN}`, role: 'employee', phone: '+27 82 100 1002' },
  { name: 'Sipho Dlamini', email: `sipho@${DEMO_DOMAIN}`, role: 'employee', phone: '+27 82 100 1003' },
  { name: 'Lerato Nkosi', email: `lerato@${DEMO_DOMAIN}`, role: 'employee', phone: '+27 82 100 1004' },
  { name: 'Kabelo Molefe', email: `kabelo@${DEMO_DOMAIN}`, role: 'employee', phone: '+27 82 100 1005' },
];

async function getOrCreateAuthUser(email, password) {
  // list + filter is the most portable way to check "already exists"
  // across supabase-js versions without relying on a specific error shape.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log('Seeding Alerta demo data for "Mandla Construction"...\n');

  const manager = PEOPLE.find((p) => p.role === 'manager');
  const managerUser = await getOrCreateAuthUser(manager.email, DEMO_PASSWORD);
  console.log(`✓ Auth user for manager (${manager.email})`);

  let { data: existingProfile } = await admin
    .from('profiles')
    .select('id, business_id')
    .eq('id', managerUser.id)
    .maybeSingle();

  let businessId;
  if (existingProfile) {
    businessId = existingProfile.business_id;
    console.log('✓ Business already exists, reusing it');
  } else {
    const { data: business, error: bizErr } = await admin
      .from('businesses')
      .insert({ name: 'Mandla Construction', plan: 'starter' })
      .select('id')
      .single();
    if (bizErr) throw bizErr;
    businessId = business.id;

    const { error: profileErr } = await admin.from('profiles').insert({
      id: managerUser.id,
      business_id: businessId,
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      role: 'manager',
      status: 'active',
    });
    if (profileErr) throw profileErr;

    await admin.from('manager_alerts').insert({
      business_id: businessId,
      user_id: managerUser.id,
      enabled: true,
    });
    console.log(`✓ Created business "Mandla Construction" (${businessId})`);
  }

  const employeeIds = {};
  for (const person of PEOPLE.filter((p) => p.role === 'employee')) {
    const user = await getOrCreateAuthUser(person.email, DEMO_PASSWORD);
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      await admin.from('profiles').insert({
        id: user.id,
        business_id: businessId,
        name: person.name,
        email: person.email,
        phone: person.phone,
        role: 'employee',
        status: 'active',
      });
      console.log(`✓ Created employee ${person.name} (${person.email})`);
    } else {
      console.log(`✓ Employee ${person.name} already exists`);
    }
    employeeIds[person.name] = user.id;
  }

  // --- Historical data so the app doesn't look empty on first login ---

  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  // Thabo: currently checked in (started 2 hours ago)
  await admin.from('shifts').upsert(
    {
      user_id: employeeIds['Thabo Mokoena'],
      business_id: businessId,
      checked_in_at: hoursAgo(2),
      checked_out_at: null,
    },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  // Sipho: checked in and out yesterday
  await admin.from('shifts').insert({
    user_id: employeeIds['Sipho Dlamini'],
    business_id: businessId,
    checked_in_at: hoursAgo(28),
    checked_out_at: hoursAgo(20),
  });

  // Lerato: currently checked in (started 45 min ago)
  await admin.from('shifts').upsert(
    {
      user_id: employeeIds['Lerato Nkosi'],
      business_id: businessId,
      checked_in_at: hoursAgo(0.75),
      checked_out_at: null,
    },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  // A resolved incident reported by Kabelo last week
  await admin.from('incidents').insert({
    business_id: businessId,
    user_id: employeeIds['Kabelo Molefe'],
    description: 'Loose scaffolding plank on the east elevation, second level. Reported before anyone was hurt.',
    location_text: 'Site B — East scaffold, Level 2',
    severity: 'moderate',
    status: 'closed',
    resolution_note: 'Plank replaced and re-secured same day. Toolbox talk held with the crew.',
    created_at: hoursAgo(24 * 6),
  });

  // An open incident from Sipho
  await admin.from('incidents').insert({
    business_id: businessId,
    user_id: employeeIds['Sipho Dlamini'],
    description: 'Spilled hydraulic fluid near the site entrance, slip hazard.',
    location_text: 'Main gate, Site B',
    severity: 'minor',
    status: 'open',
    created_at: hoursAgo(5),
  });

  // A resolved SOS event from two days ago, acknowledged + resolved by Sarah
  await admin.from('sos_events').insert({
    business_id: businessId,
    user_id: employeeIds['Thabo Mokoena'],
    triggered_at: hoursAgo(50),
    latitude: -26.2041,
    longitude: 28.0473,
    location_accuracy_m: 15,
    status: 'resolved',
    acknowledged_by: managerUser.id,
    acknowledged_at: hoursAgo(49.95),
    resolved_by: managerUser.id,
    resolved_at: hoursAgo(49.5),
    resolution_note: 'Minor fall, first aid administered on site. Employee cleared to continue light duty.',
  });

  console.log('\nDemo data ready. Sign in with:\n');
  for (const p of PEOPLE) {
    console.log(`  ${p.role.padEnd(8)} ${p.email}  /  ${DEMO_PASSWORD}`);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message || err);
  process.exit(1);
});
