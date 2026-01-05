// Supabase Edge Function for KIRI API model zip download
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KIRI_API_BASE = 'https://api.kiriengine.app';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const KIRI_API_KEY = Deno.env.get('KIRI_API_KEY');
    
    if (!KIRI_API_KEY) {
      throw new Error('KIRI_API_KEY not configured');
    }

    const { serialize } = await req.json();
    
    if (!serialize) {
      throw new Error('serialize parameter is required');
    }

    // Get model zip URL from KIRI API
    const zipUrl = new URL(`${KIRI_API_BASE}/api/v1/open/3dgs/getModelZip`);
    zipUrl.searchParams.append('serialize', serialize);
    zipUrl.searchParams.append('token', KIRI_API_KEY);

    const response = await fetch(zipUrl.toString(), {
      method: 'GET',
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in kiri-model-zip function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
