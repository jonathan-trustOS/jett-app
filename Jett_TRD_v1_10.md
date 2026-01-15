# Jett TRD v1.10 - User Management & Stripe Integration

## Version History
- v1.7.8 → v1.10: User Management system with Supabase Auth + Stripe payments

## What's New in v1.10

### User Management System (COMPLETE)
- **Supabase Auth**: Email/password authentication with email verification
- **Protected Routes**: App requires sign-in to access
- **Trial System**: 14-day free trial with banner showing days remaining
- **Session Persistence**: Stay logged in across restarts

### Stripe Integration (PARTIAL)
- **Payment Link**: "Subscribe Now" opens Stripe checkout ($12.99/month)
- **Webhook Endpoint**: Edge Function deployed at `https://crmimpveipjwwaqicwxx.supabase.co/functions/v1/stripe-webhook`
- **PENDING**: Webhook not updating profile - needs debugging

## Configuration

### Supabase
- **Project URL**: `https://crmimpveipjwwaqicwxx.supabase.co`
- **Anon Key**: `sb_publishable_Fsa_eJ592Mr10Z4cN0j5rQ_47G-YMA2`
- **Service Role Key**: `[REDACTED - stored in Supabase dashboard]`

### Stripe (Sandbox)
- **Publishable Key**: `pk_test_51SpbqjFOUtO91R5lP6igqVScgjkNy7O0SW4wbDGZ9VStFnrOSey8kssHMuGZc0xdlaI4tptZDWmQVQXVY81pokZd00GtuuQxsM`
- **Secret Key**: `[REDACTED - stored in Stripe dashboard]`
- **Payment Link**: `https://buy.stripe.com/test_9B69AT1Bn1Tp7MQdnPb7y00`
- **Product**: TrustOS Monthly - $12.99/month

### Database Schema
Tables created in Supabase:
- `profiles` - User data + subscription status
- `user_settings` - API keys, preferences
- Row Level Security enabled

### Edge Function
- **Name**: `stripe-webhook`
- **URL**: `https://crmimpveipjwwaqicwxx.supabase.co/functions/v1/stripe-webhook`
- **JWT Verification**: OFF (so Stripe can call it)
- **Secret**: `STRIPE_SECRET_KEY` added

## Files Changed

### New Files
```
src/lib/supabase.ts              # Supabase client
src/contexts/AuthContext.tsx      # Auth state management
src/components/auth/
  ├── AuthLayout.tsx             # Shared auth UI layout
  ├── AuthScreen.tsx             # Auth view router
  ├── SignUpForm.tsx             # Registration
  ├── SignInForm.tsx             # Login
  ├── VerifyEmailForm.tsx        # Email verification
  └── ForgotPasswordForm.tsx     # Password reset
supabase-schema.sql              # Database schema
```

### Modified Files
```
package.json                     # Added @supabase/supabase-js
index.html                       # Added *.supabase.co to CSP
src/App.tsx                      # Added AuthProvider, TrialBanner, protected routes
```

## Pending Issues

### Webhook Not Updating Profile
The Stripe webhook is deployed but not updating the profile after payment.

**To Debug:**
1. Check Edge Function logs: Supabase → Edge Functions → stripe-webhook → Logs
2. Test webhook manually in Stripe: Developers → Webhooks → Select endpoint → Send test webhook

**Manual Workaround:**
Run in SQL Editor to activate subscription:
```sql
UPDATE public.profiles 
SET subscription_status = 'active', trial_ends_at = NULL
WHERE email = 'jonathan@thetrusteconomy.org';
```

### Next Steps
1. Debug webhook (check logs, test event delivery)
2. Add more Stripe events (subscription.updated, subscription.deleted, invoice.payment_failed)
3. Week 3: Cloud data sync (projects/ideas stored in Supabase)

## Auth Flow

```
App Start
    ↓
Check Session (3s timeout)
    ↓
┌─────────────────┬──────────────────┐
│ No Session      │ Has Session      │
│     ↓           │      ↓           │
│ AuthScreen      │ MainApp          │
│ (SignIn/SignUp) │ + TrialBanner    │
└─────────────────┴──────────────────┘
```

## Subscription States

| Status | UI Behavior |
|--------|------------|
| `trialing` | Blue banner: "X days left in trial" |
| `active` | No banner, full access |
| `past_due` | Red banner: "Payment failed" |
| `cancelled` | Locked out, must resubscribe |

## Test Credentials

**Stripe Test Card**: `4242 4242 4242 4242` (any future expiry, any CVC)

**First User**: jonathan@thetrusteconomy.org (created, verified)
