# Jett User Management System Specification

**Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Planning

---

## Overview

Add user authentication and subscription management to Jett, transforming it from a local app to a multi-user platform. Built on Supabase (auth + database) and Stripe (payments).

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Auth | Supabase Auth | Built-in email/password, OTP, sessions |
| Database | Supabase PostgreSQL | Row-level security, real-time |
| Payments | Stripe | Industry standard, easy integration |
| Frontend | React (existing) | Already in Jett |

---

## Phase 1: Core Authentication

### 1.1 Supabase Project Setup

**Tasks:**
- [ ] Create Supabase project
- [ ] Configure auth settings (email confirmation required)
- [ ] Set up database schema
- [ ] Configure Row-Level Security policies
- [ ] Add Supabase client to Jett

**Database Schema:**

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Subscription info
  subscription_status TEXT DEFAULT 'trialing', -- trialing, active, past_due, cancelled
  subscription_plan TEXT DEFAULT 'trustos_monthly',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- LoveOS future
  loveos_tokens INTEGER DEFAULT 0,
  covenant_accepted_at TIMESTAMP WITH TIME ZONE
);

-- Projects table (user-scoped)
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'web',
  prd JSONB,
  build_steps JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ideas table (user-scoped)
CREATE TABLE public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  chat JSONB DEFAULT '[]',
  prd_captures JSONB DEFAULT '{}',
  promoted_to_project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings (API keys, preferences)
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  anthropic_api_key TEXT, -- encrypted
  default_ai_provider TEXT DEFAULT 'anthropic',
  default_ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ideas" ON public.ideas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);
```

### 1.2 Auth UI Components

**New Files:**
```
src/
├── components/
│   └── auth/
│       ├── AuthLayout.tsx      # Shared layout for auth pages
│       ├── SignUpForm.tsx      # Email + password registration
│       ├── SignInForm.tsx      # Email + password login
│       ├── VerifyEmailForm.tsx # 6-digit OTP entry
│       ├── ForgotPasswordForm.tsx
│       ├── ResetPasswordForm.tsx
│       ├── TwoFactorForm.tsx   # 2FA code entry
│       └── AccountSettings.tsx # Profile, password, delete
├── contexts/
│   └── AuthContext.tsx         # Auth state provider
├── hooks/
│   └── useAuth.ts              # Auth helpers
└── lib/
    └── supabase.ts             # Supabase client
```

### 1.3 Auth Flows

#### Sign Up Flow
```
┌─────────────────────────────────────────────────────┐
│                    Sign Up                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ Email: [________________________]             │  │
│  │ Password: [____________________]              │  │
│  │ Confirm: [_____________________]              │  │
│  │                                               │  │
│  │ Password requirements:                        │  │
│  │ • At least 8 characters                       │  │
│  │ • One uppercase letter                        │  │
│  │ • One number                                  │  │
│  │                                               │  │
│  │ [Create Account]                              │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Already have an account? Sign in                   │
└─────────────────────────────────────────────────────┘
           ↓
   Email sent with 6-digit code
           ↓
┌─────────────────────────────────────────────────────┐
│            Verify Your Email                        │
│                                                     │
│  We sent a code to you@email.com                    │
│  ┌───────────────────────────────────────────────┐  │
│  │        [_] [_] [_] [_] [_] [_]                │  │
│  │                                               │  │
│  │ [Verify]                                      │  │
│  │                                               │  │
│  │ Didn't receive it? Resend code (60s)         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓
   Account created → Redirect to app (14-day trial)
```

#### Sign In Flow
```
┌─────────────────────────────────────────────────────┐
│                    Sign In                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ Email: [________________________]             │  │
│  │ Password: [____________________]              │  │
│  │                                               │  │
│  │ [Sign In]                                     │  │
│  │                                               │  │
│  │ Forgot password?                              │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Don't have an account? Sign up                     │
└─────────────────────────────────────────────────────┘
           ↓
   If 2FA enabled:
           ↓
┌─────────────────────────────────────────────────────┐
│            Two-Factor Authentication                │
│                                                     │
│  Enter the code sent to your email                  │
│  ┌───────────────────────────────────────────────┐  │
│  │        [_] [_] [_] [_] [_] [_]                │  │
│  │                                               │  │
│  │ [Verify]                                      │  │
│  │                                               │  │
│  │ Resend code                                   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓
   Session established → Redirect to app
```

#### Forgot Password Flow
```
┌─────────────────────────────────────────────────────┐
│              Forgot Password                        │
│  ┌───────────────────────────────────────────────┐  │
│  │ Email: [________________________]             │  │
│  │                                               │  │
│  │ [Send Reset Link]                             │  │
│  │                                               │  │
│  │ Remember your password? Sign in               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓
   Email sent with magic link
           ↓
┌─────────────────────────────────────────────────────┐
│              Reset Password                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ New Password: [____________________]          │  │
│  │ Confirm: [_____________________]              │  │
│  │                                               │  │
│  │ [Reset Password]                              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓
   Password updated → Redirect to sign in
```

### 1.4 Protected Routes

```typescript
// src/App.tsx changes
import { AuthProvider, useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/signin" />
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignInForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/verify-email" element={<VerifyEmailForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        
        {/* Protected routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}
```

---

## Phase 2: Stripe Subscription

### 2.1 Stripe Setup

**Tasks:**
- [ ] Create Stripe account
- [ ] Create product: "TrustOS Monthly" ($12.99/month)
- [ ] Set up webhook endpoint
- [ ] Configure customer portal
- [ ] Add Stripe client to Jett

### 2.2 Subscription Flow

```
Trial ends (14 days)
         ↓
┌─────────────────────────────────────────────────────┐
│           Your Trial Has Ended                      │
│                                                     │
│  To continue using Jett, subscribe to TrustOS.      │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  TrustOS Monthly                              │  │
│  │  $12.99/month                                 │  │
│  │                                               │  │
│  │  ✓ Unlimited projects                         │  │
│  │  ✓ Deploy to appname.jett.app                │  │
│  │  ✓ AI-powered builds                          │  │
│  │  ✓ Code review & simplification              │  │
│  │                                               │  │
│  │  [Subscribe Now]                              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         ↓
   Stripe Checkout (hosted page)
         ↓
   Webhook: subscription.created
         ↓
   Update profile.subscription_status = 'active'
         ↓
   Redirect to app
```

### 2.3 Subscription States

| Status | Can Use App? | UI Behavior |
|--------|--------------|-------------|
| `trialing` | Yes | Show "X days left in trial" banner |
| `active` | Yes | Full access |
| `past_due` | Yes (grace) | Show "Payment failed" banner, 7-day grace |
| `cancelled` | No | Redirect to subscribe page |

### 2.4 Billing Management

```
Account Settings → Billing
         ↓
┌─────────────────────────────────────────────────────┐
│                    Billing                          │
│                                                     │
│  Current Plan: TrustOS Monthly                      │
│  Status: Active                                     │
│  Next billing: February 13, 2026                    │
│  Amount: $12.99                                     │
│                                                     │
│  [Manage Billing →]  (opens Stripe Customer Portal) │
│                                                     │
│  • Update payment method                            │
│  • View invoices                                    │
│  • Cancel subscription                              │
└─────────────────────────────────────────────────────┘
```

---

## Phase 3: Data Migration

### 3.1 Local → Cloud Migration

When user signs up, their local data needs to migrate to Supabase.

```typescript
async function migrateLocalData(userId: string) {
  // 1. Get local projects
  const localProjects = await window.jett.getProjects()
  
  // 2. Get local ideas
  const localIdeas = await window.jett.getIdeas()
  
  // 3. Get local settings
  const localSettings = await window.jett.getSettings()
  
  // 4. Upload to Supabase
  for (const project of localProjects) {
    await supabase.from('projects').insert({
      user_id: userId,
      ...project
    })
  }
  
  for (const idea of localIdeas) {
    await supabase.from('ideas').insert({
      user_id: userId,
      ...idea
    })
  }
  
  await supabase.from('user_settings').upsert({
    user_id: userId,
    anthropic_api_key: localSettings.anthropicKey,
    // ... other settings
  })
  
  // 5. Clear local data (optional, or keep as backup)
}
```

### 3.2 Hybrid Storage Strategy

During transition, support both local and cloud:

| Data | Local | Cloud | Priority |
|------|-------|-------|----------|
| Projects | ✅ | ✅ | Cloud if logged in |
| Ideas | ✅ | ✅ | Cloud if logged in |
| Settings | ✅ | ✅ | Cloud if logged in |
| Build artifacts | ✅ | ❌ | Always local |
| Generated code | ✅ | ❌ | Always local |

---

## Phase 4: Account Management

### 4.1 Account Settings UI

```
Settings → Account
         ↓
┌─────────────────────────────────────────────────────┐
│                    Account                          │
│                                                     │
│  Email: jonathan@example.com                        │
│  [Change Email]                                     │
│                                                     │
│  Password: ••••••••••                               │
│  [Change Password]                                  │
│                                                     │
│  Two-Factor Authentication: Enabled                 │
│  [Disable 2FA]                                      │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Danger Zone                                        │
│  [Delete Account]                                   │
│  This will permanently delete all your data.        │
└─────────────────────────────────────────────────────┘
```

### 4.2 Session Management

- JWT tokens stored in Electron's secure storage
- Auto-refresh tokens before expiry
- Auto-logout after 30 minutes of inactivity
- "Remember me" option extends session to 30 days

---

## Implementation Order

### Week 1: Core Auth
1. Set up Supabase project
2. Create database schema
3. Build auth UI components (SignUp, SignIn, Verify)
4. Implement AuthContext and protected routes
5. Test full sign up → sign in flow

### Week 2: Subscription
1. Set up Stripe account and products
2. Create checkout integration
3. Build subscription status UI
4. Implement webhook handlers
5. Test trial → subscribe flow

### Week 3: Data & Polish
1. Implement data migration (local → cloud)
2. Build account settings UI
3. Add billing management
4. Test edge cases (expired trials, failed payments)
5. Polish and bug fixes

---

## Security Checklist

- [ ] Email verification required before full access
- [ ] Password requirements enforced (8+ chars, uppercase, number)
- [ ] 2FA available (email OTP)
- [ ] API keys encrypted at rest
- [ ] Row-level security on all tables
- [ ] JWT tokens stored securely (not localStorage)
- [ ] HTTPS only
- [ ] Rate limiting on auth endpoints
- [ ] Password reset tokens expire after 1 hour
- [ ] Failed login attempts limited (5 per 15 min)

---

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_... # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...

# App
VITE_APP_URL=https://jett.app
```

---

## API Endpoints (Supabase Edge Functions)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/create-checkout-session` | POST | Start Stripe checkout |
| `/create-portal-session` | POST | Open Stripe billing portal |
| `/webhook/stripe` | POST | Handle Stripe webhooks |

---

## LoveOS Integration Points

Future hooks for LoveOS token economy:

1. **User ID** = LoveOS identity (UUID is portable)
2. **Subscription** can convert to token balance
3. **covenant_accepted_at** tracks "I Am" acceptance
4. **loveos_tokens** column ready for credit system
5. **Grace handling** via subscription status already built

---

## Questions to Resolve

**RESOLVED:**

| Question | Decision | Notes |
|----------|----------|-------|
| Trial length | 14 days | Billing automatic unless cancelled |
| Grace period | 7 days | After payment fails, before lockout |
| Data retention | Forever | Soft delete - users will come back |
| Data export | No | Apps stay in TrustOS universe |

---

## Subscription Behavior

### Trial → Subscription (Automatic)
```
Day 1: Sign up → 14-day trial starts
Day 14: Card charged $12.99 (if provided) OR trial ends
  └── Card on file: subscription_status = 'active'
  └── No card: subscription_status = 'cancelled' (prompt to add card)
```

### Payment Failure → Grace → Lockout
```
Payment fails → subscription_status = 'past_due'
  └── Day 1-7: Can still use app, banner shows "Update payment method"
  └── Day 8: subscription_status = 'cancelled', locked out
```

### Account "Deletion" (Soft Delete)
```
User clicks "Delete Account"
  └── subscription cancelled in Stripe
  └── profile.deleted_at = NOW()
  └── subscription_status = 'deleted'
  └── Data preserved (not visible to user)
  └── Can reactivate by signing in + subscribing
```

### Reactivation Flow
```
Former user signs in
  └── "Welcome back! Subscribe to continue"
  └── subscription_status = 'cancelled' or 'deleted'
  └── Stripe checkout
  └── profile.deleted_at = NULL
  └── All previous data restored
```

---

*This spec will be updated as implementation progresses.*
