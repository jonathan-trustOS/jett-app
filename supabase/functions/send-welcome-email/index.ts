import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, firstName } = await req.json();
    const name = firstName || "there";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Jonathan <jonathan@jettbuilder.com>",
        to: email,
        subject: "Your ideas have been waiting for this",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${name},</p>
  
  <p>I'm Jonathan, the creator of Jett.</p>
  
  <p>I built this because I watched too many brilliant designers get stuck at the same wall: "I need a developer."</p>
  
  <p>That wall is gone now.</p>
  
  <p>Describe what you see in your head. Jett builds it. You ship it. That's it.</p>
  
  <p><strong>Get started:</strong></p>
  <ol>
    <li><a href="https://github.com/jonathan-trustOS/jett-app/releases" style="color: #3b82f6;">Download Jett</a></li>
    <li>Add your API key in Settings</li>
    <li>Describe something you've been meaning to build</li>
  </ol>
  
  <p>What's the project that's been living in your head rent-free?</p>
  
  <p>Hit reply — I read every one.</p>
  
  <p>Jonathan</p>
</body>
</html>`,
        text: `Hey ${name},

I'm Jonathan, the creator of Jett.

I built this because I watched too many brilliant designers get stuck at the same wall: "I need a developer."

That wall is gone now.

Describe what you see in your head. Jett builds it. You ship it. That's it.

Get started:
1. Download Jett — https://github.com/jonathan-trustOS/jett-app/releases
2. Add your API key in Settings
3. Describe something you've been meaning to build

What's the project that's been living in your head rent-free?

Hit reply — I read every one.

Jonathan`,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.ok ? 200 : 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
