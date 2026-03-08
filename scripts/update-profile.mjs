import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqxsnpcnhiwjbbmwqfdp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'berdefymarlon@gmail.com';

  // List all players
  console.log('Listing all players...');
  const { data: allPlayers, error: listError } = await supabase
    .from('players')
    .select('id, user_id, name, position, jersey_number');

  if (listError) {
    console.error('Error listing players:', listError);
  } else {
    console.log('All players:', allPlayers);
  }

  // List all profiles
  console.log('\nListing all profiles...');
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, roles');

  if (profilesError) {
    console.error('Error listing profiles:', profilesError);
  } else {
    console.log('All profiles:', allProfiles);
  }

  // First, fetch the profile
  console.log('\nFetching your profile...');
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, roles')
    .eq('email', email)
    .single();

  if (fetchError) {
    console.error('Error fetching profile:', fetchError);
    return;
  }

  console.log('Current profile:', profile);

  // Check if player record exists
  console.log('\nFetching player record...');
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, user_id, name, position, jersey_number, is_alumni, is_retired')
    .eq('user_id', profile.id)
    .single();

  if (playerError && playerError.code !== 'PGRST116') {
    console.error('Error fetching player:', playerError);
  } else if (player) {
    console.log('Player record:', player);
  } else {
    console.log('No player record found for this profile');
  }

  // Try to update the profile roles
  console.log('\nAttempting to update roles...');
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ roles: ['admin', 'player'] })
    .eq('email', email)
    .select();

  if (updateError) {
    console.error('Error updating profile:', updateError);
    console.log('\nNote: You may need to run this SQL manually in Supabase Dashboard:');
    console.log(`UPDATE public.profiles SET roles = ARRAY['admin', 'player']::TEXT[] WHERE email = '${email}';`);
  } else {
    console.log('Updated profile:', updated);
  }

  // Try to update player position to GK if player exists
  if (player) {
    console.log('\nAttempting to update player position to GK...');
    const { data: updatedPlayer, error: playerUpdateError } = await supabase
      .from('players')
      .update({ position: 'GK', is_alumni: false, is_retired: false })
      .eq('user_id', profile.id)
      .select();

    if (playerUpdateError) {
      console.error('Error updating player:', playerUpdateError);
      console.log('\nNote: You may need to run this SQL manually in Supabase Dashboard:');
      console.log(`UPDATE public.players SET position = 'GK', is_alumni = false, is_retired = false WHERE user_id = '${profile.id}';`);
    } else {
      console.log('Updated player:', updatedPlayer);
    }
  }
}

main().catch(console.error);
