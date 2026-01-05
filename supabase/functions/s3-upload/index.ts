// Supabase Edge Function for AWS S3 uploads using AWS Signature V4
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
    const S3_BUCKET = Deno.env.get('S3_BUCKET');

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET) {
      throw new Error('AWS credentials not configured');
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const fileName = formData.get('fileName') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename if not provided
    const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const key = `${folder}/${finalFileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);
    const contentType = file.type || 'application/octet-stream';

    // Create the S3 URL
    const host = `${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    const url = `https://${host}/${key}`;

    // Create date strings for signing
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    // Helper function to create hex string from ArrayBuffer
    const toHex = (buffer: ArrayBuffer): string => 
      Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Calculate payload hash
    const payloadHash = await crypto.subtle.digest('SHA-256', body);
    const payloadHashHex = toHex(payloadHash);

    // Create canonical request
    const canonicalUri = '/' + encodeURIComponent(key).replace(/%2F/g, '/');
    const canonicalQuerystring = '';
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHashHex}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${AWS_REGION}/s3/aws4_request`;
    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${toHex(canonicalRequestHash)}`;

    // Calculate signature using HMAC chain
    const getSignatureKey = async (secretKey: string, dateStamp: string, region: string, service: string): Promise<CryptoKey> => {
      const kDate = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode('AWS4' + secretKey),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const kDateSigned = await crypto.subtle.sign('HMAC', kDate, new TextEncoder().encode(dateStamp));
      
      const kRegion = await crypto.subtle.importKey(
        'raw', new Uint8Array(kDateSigned),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const kRegionSigned = await crypto.subtle.sign('HMAC', kRegion, new TextEncoder().encode(region));
      
      const kService = await crypto.subtle.importKey(
        'raw', new Uint8Array(kRegionSigned),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const kServiceSigned = await crypto.subtle.sign('HMAC', kService, new TextEncoder().encode(service));
      
      const kSigning = await crypto.subtle.importKey(
        'raw', new Uint8Array(kServiceSigned),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      return kSigning;
    };

    const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, 's3');
    const signatureBuffer = await crypto.subtle.sign('HMAC', signingKey, new TextEncoder().encode(stringToSign));
    const signature = toHex(signatureBuffer);

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Make the PUT request to S3
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Host': host,
        'x-amz-content-sha256': payloadHashHex,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3 upload error:', errorText);
      throw new Error(`S3 upload failed: ${response.status}`);
    }

    console.log('File uploaded to S3:', url);

    return new Response(
      JSON.stringify({ success: true, url, key }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in s3-upload function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
