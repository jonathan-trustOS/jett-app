# Account Management Handoff - v1.13

## What's New

### User Menu Dropdown
A new user avatar button appears **to the right of the Settings gear icon** in the header.

```
[Settings ⚙️] [User 👤]
```

Click the avatar to open the dropdown menu:

```
┌─────────────────────────────┐
│ 👤 jonathan@example.com     │
│    ✓ Active                 │
├─────────────────────────────┤
│ 🔒 Change Password          │
│ 💳 Manage Subscription →    │
├─────────────────────────────┤
│ 🚪 Log Out                  │
└─────────────────────────────┘
```

### Features

| Feature | What it does |
|---------|--------------|
| **Account Info** | Shows email + subscription status (Active, Trial, Past Due) |
| **Change Password** | Sends password reset email via Supabase |
| **Manage Subscription** | Opens Stripe Customer Portal in browser |
| **Log Out** | Signs out, clears session, shows login screen |

---

## Files Changed

### New Files
- `src/components/UserMenu.tsx` — The dropdown component

### Modified Files
- `src/App.tsx` — Added UserMenu import and component after Settings button

---

## To Test

1. **Run the app:**
   ```bash
   cd jett-1.7.2
   npm run dev
   ```

2. **Test each feature:**
   - [ ] Click user avatar → dropdown opens
   - [ ] Click outside → dropdown closes
   - [ ] Email shows correctly
   - [ ] Subscription status displays (Active/Trial/etc)
   - [ ] "Change Password" → shows "Check your email ✓"
   - [ ] "Manage Subscription" → opens Stripe portal
   - [ ] "Log Out" → returns to login screen

---

## Notes

### Stripe Customer Portal
Currently using **test mode** portal:
```
https://billing.stripe.com/p/login/test_00g8z7erM5kL9zy288
```

For production:
1. Go to Stripe Dashboard → Settings → Billing → Customer Portal
2. Configure features (update payment, cancel subscription, etc.)
3. Get production portal URL
4. Update `STRIPE_CUSTOMER_PORTAL` in `UserMenu.tsx`

### Password Reset
Uses Supabase's built-in `resetPasswordForEmail()`. The email comes from Supabase's email service (no additional setup needed).

---

## TRD Updated
See `Jett_TRD_v1_13.md` for complete documentation and feature status.
