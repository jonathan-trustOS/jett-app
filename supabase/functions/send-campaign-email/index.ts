import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getEmailTemplate(type: string, firstName: string): EmailTemplate {
  const name = firstName || "there";

  const templates: Record<string, EmailTemplate> = {
    // Email 1: Welcome (already deployed separately, but included for completeness)
    welcome: {
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
    },

    // Email 2: Quick Win (Day 2)
    quick_win: {
      subject: "The thing you've been putting off",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${name},</p>
  
  <p>You know that idea? The one you've sketched out a dozen times but never built because "it's not worth bothering a developer for"?</p>
  
  <p>Build it today.</p>
  
  <p>Open Jett and type exactly what's in your head:</p>
  
  <p style="color: #666; font-style: italic; margin-left: 20px;">
    "A simple habit tracker with streaks"<br>
    "A landing page for my side project"<br>
    "A client portal where people can check their order status"
  </p>
  
  <p>Don't overthink it. The first version is supposed to be rough.</p>
  
  <p>What are you going to build?</p>
  
  <p>Jonathan</p>
</body>
</html>`,
      text: `Hey ${name},

You know that idea? The one you've sketched out a dozen times but never built because "it's not worth bothering a developer for"?

Build it today.

Open Jett and type exactly what's in your head:

"A simple habit tracker with streaks"
"A landing page for my side project"
"A client portal where people can check their order status"

Don't overthink it. The first version is supposed to be rough.

What are you going to build?

Jonathan`,
    },

    // Email 3: Pro Tips (Day 5)
    pro_tips: {
      subject: "The code was never the point",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${name},</p>
  
  <p>Here's what I've learned watching people use Jett:</p>
  
  <p>The ones who ship fastest aren't the most technical. They're the ones who know exactly what they want and aren't afraid to say it plainly.</p>
  
  <p>Three things that help:</p>
  
  <p><strong>Talk like you're explaining to a colleague.</strong> "Login page with Google auth and a forgot password link" beats "add authentication."</p>
  
  <p><strong>Ugly first, pretty later.</strong> Get the functionality working, then say "make this look more professional."</p>
  
  <p><strong>Start in Ideas mode.</strong> Brainstorm before you build. The AI remembers everything.</p>
  
  <p>The tool gets smarter the more specific you are. Your design instincts are the asset here — not coding knowledge.</p>
  
  <p>Questions? I'm here.</p>
  
  <p>Jonathan</p>
</body>
</html>`,
      text: `Hey ${name},

Here's what I've learned watching people use Jett:

The ones who ship fastest aren't the most technical. They're the ones who know exactly what they want and aren't afraid to say it plainly.

Three things that help:

Talk like you're explaining to a colleague. "Login page with Google auth and a forgot password link" beats "add authentication."

Ugly first, pretty later. Get the functionality working, then say "make this look more professional."

Start in Ideas mode. Brainstorm before you build. The AI remembers everything.

The tool gets smarter the more specific you are. Your design instincts are the asset here — not coding knowledge.

Questions? I'm here.

Jonathan`,
    },

    // Email 4: Trial Ending (3 days before)
    trial_ending: {
      subject: "3 days left to keep building",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${name},</p>
  
  <p>Your Jett trial ends in 3 days.</p>
  
  <p>If you've built something — or even just started something — I'd love for you to keep going.</p>
  
  <p style="margin: 24px 0;">
    <a href="https://jettbuilder.com/checkout.html" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Continue with Jett Pro</a>
  </p>
  
  <p>If you hit a wall or something felt off, tell me. I'm still building this thing too, and your feedback shapes what comes next.</p>
  
  <p>Just reply.</p>
  
  <p>Jonathan</p>
</body>
</html>`,
      text: `Hey ${name},

Your Jett trial ends in 3 days.

If you've built something — or even just started something — I'd love for you to keep going.

→ Continue with Jett Pro: https://jettbuilder.com/checkout.html

If you hit a wall or something felt off, tell me. I'm still building this thing too, and your feedback shapes what comes next.

Just reply.

Jonathan`,
    },

    // Email 5: Trial Ended
    trial_ended: {
      subject: "Don't let it stay in your head",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${name},</p>
  
  <p>Your trial ended, but that idea you had didn't go anywhere.</p>
  
  <p>It's still there. Waiting.</p>
  
  <p>If cost was the hesitation, here's 20% off your first 3 months:</p>
  
  <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 20px 0;">BUILDER20</p>
  
  <p style="margin: 24px 0;">
    <a href="https://jettbuilder.com/checkout.html" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reactivate Jett</a>
  </p>
  
  <p style="color: #666; font-size: 14px;">Expires in 48 hours.</p>
  
  <p>The world needs what only you can see.</p>
  
  <p>Jonathan</p>
</body>
</html>`,
      text: `Hey ${name},

Your trial ended, but that idea you had didn't go anywhere.

It's still there. Waiting.

If cost was the hesitation, here's 20% off your first 3 months:

Code: BUILDER20

→ Reactivate Jett: https://jettbuilder.com/checkout.html

Expires in 48 hours.

The world needs what only you can see.

Jonathan`,
    },
  };

  return templates[type] || templates.welcome;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, firstName, emailType } = await req.json();

    if (!email || !emailType) {
      throw new Error("Missing email or emailType");
    }

    const template = getEmailTemplate(emailType, firstName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Jonathan <jonathan@jettbuilder.com>",
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    // Log to Supabase for tracking
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    await supabase.from("email_log").insert({
      email,
      email_type: emailType,
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
