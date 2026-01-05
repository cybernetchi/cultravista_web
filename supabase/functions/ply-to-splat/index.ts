// Supabase Edge Function for PLY to Splat conversion via AWS Lambda
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LAMBDA_URL = 'https://by6oy6pubv7yeppnm7fau42uam0geivb.lambda-url.us-east-2.on.aws/';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { s3_url } = await req.json();
    
    if (!s3_url) {
      throw new Error('s3_url parameter is required');
    }

    console.log('Calling Lambda for PLY to Splat conversion:', s3_url);

    // Call AWS Lambda for conversion
    const response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ s3_url }),
    });

    const data = await response.json();
    console.log('Lambda response:', data);

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 200 : response.status,
      }
    );
  } catch (error: unknown) {
    console.error('Error in ply-to-splat function:', error);
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
