import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  type LicensePayload,
  licenseSigningBytes,
  toBase64,
} from '../../../packages/domain/src/license.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Check if user is vendor staff
    const { data: isVendor } = await supabaseClient.rpc('app_is_vendor');
    if (!isVendor) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { action, payload } = await req.json();

    if (action === 'sign') {
      const privateKeyText = Deno.env.get('LICENSE_PRIVATE_KEY');
      if (!privateKeyText) {
        throw new Error('LICENSE_PRIVATE_KEY not configured');
      }

      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        Uint8Array.from(atob(privateKeyText), (c) => c.charCodeAt(0)),
        { name: 'Ed25519' },
        false,
        ['sign'],
      );

      const signature = await crypto.subtle.sign(
        { name: 'Ed25519' },
        privateKey,
        licenseSigningBytes(payload as LicensePayload),
      );

      return new Response(JSON.stringify({ signature: toBase64(new Uint8Array(signature)) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
