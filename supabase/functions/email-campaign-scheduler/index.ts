import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const now = new Date();
    const results = { quick_win: 0, pro_tips: 0, trial_ending: 0, trial_ended: 0 };

    // Get all profiles with their email history
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, trial_ends_at, subscription_status");

    if (profilesError) throw profilesError;

    // Get all sent emails to avoid duplicates
    const { data: sentEmails, error: sentError } = await supabase
      .from("email_log")
      .select("email, email_type");

    if (sentError) throw sentError;

    // Create a Set for quick lookup: "email:type"
    const sentSet = new Set(sentEmails?.map((e) => `${e.email}:${e.email_type}`) || []);

    for (const profile of profiles || []) {
      const { email, full_name, created_at, trial_ends_at, subscription_status } = profile;
      
      if (!email) continue;
      
      // Skip if already subscribed
      if (subscription_status === "active") continue;

      const firstName = full_name?.split(" ")[0] || "";
      const signupDate = new Date(created_at);
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let daysUntilTrialEnds = null;
      if (trial_ends_at) {
        const trialEnd = new Date(trial_ends_at);
        daysUntilTrialEnds = Math.floor((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Determine which email to send
      let emailType: string | null = null;

      // Email 2: Quick Win - Day 2 (1-2 days after signup)
      if (daysSinceSignup >= 2 && daysSinceSignup < 3 && !sentSet.has(`${email}:quick_win`)) {
        emailType = "quick_win";
      }
      // Email 3: Pro Tips - Day 5 (5-6 days after signup)
      else if (daysSinceSignup >= 5 && daysSinceSignup < 6 && !sentSet.has(`${email}:pro_tips`)) {
        emailType = "pro_tips";
      }
      // Email 4: Trial Ending - 3 days before
      else if (daysUntilTrialEnds !== null && daysUntilTrialEnds <= 3 && daysUntilTrialEnds > 0 && !sentSet.has(`${email}:trial_ending`)) {
        emailType = "trial_ending";
      }
      // Email 5: Trial Ended - trial expired
      else if (daysUntilTrialEnds !== null && daysUntilTrialEnds <= 0 && !sentSet.has(`${email}:trial_ended`)) {
        emailType = "trial_ended";
      }

      // Send the email if we determined one should go out
      if (emailType) {
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ email, firstName, emailType }),
          });

          if (response.ok) {
            results[emailType as keyof typeof results]++;
            console.log(`Sent ${emailType} to ${email}`);
          } else {
            console.error(`Failed to send ${emailType} to ${email}`);
          }
        } catch (err) {
          console.error(`Error sending ${emailType} to ${email}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email campaign processed",
        sent: results,
        total: Object.values(results).reduce((a, b) => a + b, 0),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Campaign scheduler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
