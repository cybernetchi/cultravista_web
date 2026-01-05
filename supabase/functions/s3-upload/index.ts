// Supabase Edge Function for AWS S3 uploads
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.400.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
    const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";
    const S3_BUCKET = Deno.env.get("S3_BUCKET");

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET) {
      throw new Error("AWS credentials not configured");
    }

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";
    const fileName = formData.get("fileName") as string;

    if (!file) {
      throw new Error("No file provided");
    }

    // Generate unique filename if not provided
    const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const key = `${folder}/${finalFileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3Client.send(command);

    // Construct the S3 URL
    const url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return new Response(JSON.stringify({ success: true, url, key }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error in s3-upload function:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
