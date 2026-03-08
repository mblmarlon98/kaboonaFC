// Supabase Edge Function: send-push-notification
// Triggered by webhook on notifications table INSERT
// Sends FCM push notification to user's registered devices
//
// Setup required:
// 1. Create Firebase project and get server key
// 2. Set secret: supabase secrets set FCM_SERVER_KEY=your_key
// 3. Create webhook: supabase functions deploy send-push-notification
// 4. Wire DB webhook on notifications INSERT to this function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    reference_type: string | null;
    reference_id: string | null;
  };
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
      return new Response('Ignored', { status: 200 });
    }

    const { user_id, title, body, type, reference_type, reference_id } = payload.record;

    // Fetch user's device tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError || !tokens?.length) {
      return new Response('No tokens found', { status: 200 });
    }

    if (!FCM_SERVER_KEY) {
      console.log('FCM_SERVER_KEY not set, skipping push');
      return new Response('FCM not configured', { status: 200 });
    }

    // Send FCM notification to each device
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: token,
            notification: { title, body, icon: '/kaboona-logo.png' },
            data: { type, referenceType: reference_type, referenceId: reference_id },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Clean up invalid tokens
          if (response.status === 404 || errorText.includes('NotRegistered')) {
            await supabase.from('device_tokens').delete().eq('token', token);
          }
          throw new Error(`FCM error: ${errorText}`);
        }

        return response.json();
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ sent, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
