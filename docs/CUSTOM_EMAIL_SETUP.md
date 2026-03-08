# Custom Email Setup Guide for Kaboona FC

This document outlines how to set up custom email sending (e.g., `noreply@kaboonafc.com`) for authentication emails in Supabase.

## Overview

By default, Supabase sends authentication emails from their domain. To send from your own domain (e.g., `@kaboonafc.com`), you need to:

1. Register a domain
2. Set up email hosting/SMTP
3. Configure Supabase to use your SMTP server

---

## Step 1: Register a Domain

Choose and register a domain. Recommended options for a football club:

| Domain | Availability | Notes |
|--------|-------------|-------|
| `kaboonafc.com` | Check availability | Most professional |
| `kaboona.club` | Check availability | `.club` is perfect for sports |
| `kaboona.team` | Check availability | Also good for sports |
| `kaboonafc.my` | Check availability | Malaysian domain |

**Registrars:**
- [Namecheap](https://namecheap.com)
- [Cloudflare](https://cloudflare.com) (often cheapest)
- [Google Domains](https://domains.google)

---

## Step 2: Set Up Email Hosting / SMTP

You need an SMTP server to send emails. Options:

### Option A: Transactional Email Services (Recommended)

Best for authentication emails - high deliverability, easy setup.

| Service | Free Tier | Setup Difficulty |
|---------|-----------|------------------|
| [Resend](https://resend.com) | 3,000 emails/month | Easy |
| [SendGrid](https://sendgrid.com) | 100 emails/day | Medium |
| [Mailgun](https://mailgun.com) | 5,000 emails/month (3 months) | Medium |
| [Postmark](https://postmarkapp.com) | 100 emails/month | Easy |
| [AWS SES](https://aws.amazon.com/ses/) | 62,000 emails/month (if from EC2) | Hard |

### Option B: Full Email Hosting

If you also want to receive emails (inbox):

| Service | Cost | Notes |
|---------|------|-------|
| [Google Workspace](https://workspace.google.com) | $6/user/month | Full Gmail experience |
| [Zoho Mail](https://zoho.com/mail) | Free (up to 5 users) | Good free option |
| [ProtonMail](https://proton.me/business) | $4/user/month | Privacy focused |

---

## Step 3: DNS Configuration

After choosing your email provider, you'll need to add DNS records:

### Required Records

```
# MX Records (for receiving - if using full email hosting)
@ MX 10 mail.provider.com

# SPF Record (authorizes sending)
@ TXT "v=spf1 include:_spf.provider.com ~all"

# DKIM Record (email signature)
selector._domainkey TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

# DMARC Record (policy)
_dmarc TXT "v=DMARC1; p=none; rua=mailto:admin@yourdomain.com"
```

Each provider gives you specific values - follow their documentation.

---

## Step 4: Configure Supabase SMTP

### Via Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Project Settings** → **Authentication** → **SMTP Settings**
4. Enable "Custom SMTP"
5. Fill in the details:

```
Host: smtp.your-provider.com
Port: 587 (or 465 for SSL)
Username: your-smtp-username
Password: your-smtp-password
Sender email: noreply@kaboonafc.com
Sender name: Kaboona FC
```

### Via Supabase CLI (Alternative)

```bash
# In supabase/config.toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.email.smtp]
host = "smtp.your-provider.com"
port = 587
user = "your-username"
pass = "env(SMTP_PASSWORD)"
admin_email = "admin@kaboonafc.com"
sender_name = "Kaboona FC"
```

---

## Step 5: Customize Email Templates

In Supabase Dashboard:

1. Go to **Authentication** → **Email Templates**
2. Customize each template:
   - **Confirm signup** - Sent when user registers
   - **Magic Link** - For passwordless login
   - **Change Email Address** - When user changes email
   - **Reset Password** - Password reset link

### Example Template (Confirm Signup)

```html
<h2>Welcome to Kaboona FC!</h2>

<p>Thanks for signing up. Please confirm your email address by clicking the button below:</p>

<a href="{{ .ConfirmationURL }}" style="
  display: inline-block;
  padding: 12px 24px;
  background-color: #D4AF37;
  color: #000;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
">
  Confirm Email
</a>

<p>Or copy this link: {{ .ConfirmationURL }}</p>

<p>This link expires in 24 hours.</p>

<p>— The Kaboona FC Team</p>
```

---

## Step 6: Enable Email Confirmations

In Supabase Dashboard:

1. Go to **Authentication** → **Providers** → **Email**
2. Ensure these are enabled:
   - ✅ Enable Email provider
   - ✅ Confirm email (requires email verification)
   - ✅ Secure email change (requires confirmation)

---

## Testing

After setup, test the flow:

1. Register a new account
2. Check that email arrives from your custom domain
3. Verify the email looks correct
4. Test the confirmation link works
5. Test password reset flow

---

## Troubleshooting

### Emails not sending
- Check SMTP credentials are correct
- Verify DNS records are propagated (use [MXToolbox](https://mxtoolbox.com))
- Check Supabase logs for SMTP errors

### Emails going to spam
- Ensure SPF, DKIM, DMARC records are set up
- Use a reputable transactional email service
- Avoid spam trigger words in templates

### Confirmation links not working
- Check the Site URL in Supabase settings matches your domain
- Verify redirect URLs are configured

---

## Quick Reference

| What | Where |
|------|-------|
| SMTP Settings | Supabase → Project Settings → Auth → SMTP |
| Email Templates | Supabase → Authentication → Email Templates |
| Email Provider Toggle | Supabase → Authentication → Providers → Email |
| Site URL | Supabase → Project Settings → General |
| Redirect URLs | Supabase → Authentication → URL Configuration |

---

## Recommended Setup for Kaboona FC

**Budget-friendly option:**
1. Domain: `kaboonafc.com` (~$12/year on Cloudflare)
2. Email sending: Resend (free tier - 3,000 emails/month)
3. Receiving inbox: Zoho Mail (free for 5 users)

**Total cost: ~$12/year** (just the domain)

---

*Document created: February 2026*
*Last updated: February 2026*
