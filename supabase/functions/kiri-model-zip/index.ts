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
    const zipUrl = new URL(`${KIRI_API_BASE}/api/v1/open/model/getModelZip`);
    zipUrl.searchParams.append('serialize', serialize);

    const response = await fetch(zipUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIRI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`KIRI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in kiri-model-zip function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
