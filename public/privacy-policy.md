# Privacy Policy

**The privacy policy you agree to by using Thoughtful App Co. apps and services.**

**Last Updated:** December 26, 2025

---

## Summary

We prioritize your privacy by giving you full control over your data. Here's how we handle your privacy based on how you interact with Thoughtful App Co.

### TACo Apps (Tempo, Tenure, FriendLy, LOL, Nurture, JustInCase, Manifest, Augment)

- **All data is saved locally on your device** and is never sent to our servers unless you explicitly opt into cloud sync.
- **We do not collect any personal data by default** beyond what you create within the apps.
- **We do not collect any telemetry data.** No usage tracking, no analytics beacons, no phone-home metrics.
- TACo apps may connect to the internet to:
  - Check for app updates (can be disabled in settings)
  - Process AI features when you use managed AI or BYOK (Bring Your Own Key) features
  - Sync your data across devices if you subscribe to Sync & Backup
- **Third-party AI features** (Tempo, Tenure) use Anthropic's Claude API. When you use AI features, we send only the specific content you're processing (e.g., task descriptions, resume text, job postings). We never send your entire data vault.
- **Export anytime:** All apps support free CSV and JSON export. Your data is never locked in.

### Sync & Backup (Optional Paid Feature)

- If you subscribe to **Sync & Backup** for any app, we store your data on our servers to provide cross-device synchronization.
- Your data is **encrypted in transit** using industry-standard HTTPS/TLS protocols.
- If your Sync subscription expires or you cancel, we **email you a final backup**, then archive your data in cold storage for **2 years** before permanent deletion. This gives you time to return if you change your mind.
- Local data on your devices is **never affected** by subscription status—it stays in your browser.

### TACo Account

- To purchase products and services (Sync, Extras, Loco TACo Club), you need to provide an **email address**.
- We don't share your email with third parties, except **payment processors** (Stripe, PayPal).
- We only send **payment receipts and important product updates** to your email. No spam, no marketing fluff.
- You may **delete your TACo account** at any time using the account dashboard, which will permanently delete your account, licenses, and subscriptions.

### BYOK (Bring Your Own Key)

- Some apps (Tempo, Tenure) offer **BYOK** for AI features, allowing you to use your own Anthropic API key.
- **API keys are stored locally in your browser** and never transmitted to TACo servers.
- We assume **no liability** for how you use your API keys. You're responsible for API costs and compliance.
- Alternatively, you can pay for **Managed AI** (via Extras), and we handle the API keys for you.

### Community & Support

- Support communications via email (launch@thoughtfulapp.co) are handled directly by TACo.
- We do not have forums, Discord servers, or third-party community platforms at this time.

---

## Privacy Policy

**Effective Date:** December 26, 2025

Thoughtful App Co. and Erikk Shupp ("we," "us," "our," or "Company") operates the Thoughtful App ecosystem, including but not limited to **Tempo, Tenure, FriendLy, LOL, Nurture, JustInCase, Manifest, and Augment** (collectively, the "Apps" or "Services").

This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information when you use our Apps and related services.

---

## 1. Local-First Apps

### 1.1 Core Privacy Philosophy

All TACo apps are built with a **local-first architecture**. This means:

- **Your data lives on your device.** By default, everything you create—tasks, resumes, schedules, notes, profiles—is stored in your browser's local storage.
- **No servers required for basic features.** You can use every app without creating a TACo account or connecting to the internet (except for AI features and updates).
- **You control sync.** Data only leaves your device when you explicitly choose to enable cloud sync (a paid feature) or use AI-powered features.

### 1.2 When TACo Apps Connect to the Internet

TACo apps may connect to the internet for the following reasons:

1. **App Updates:** Checking for new versions (can be disabled in app settings).
2. **AI Features:** Processing tasks, resumes, or other content via Anthropic's Claude API (Tempo, Tenure).
3. **Cloud Sync:** Synchronizing your data across devices if you subscribe to Sync & Backup.
4. **Career Data:** Fetching job outlook and salary information from the U.S. Department of Labor's O\*NET API (Tenure only).
5. **Account & Payments:** Managing your TACo account, subscriptions, and billing via Stripe.

We **do not connect to the internet** for telemetry, usage tracking, advertising, or any other background data collection.

### 1.3 No Telemetry or Analytics

We do not collect:

- Usage statistics (how often you use apps, which features you click)
- Device fingerprints or identifiers beyond basic browser information
- Location data (unless you explicitly enter it into an app like FriendLy)
- Behavioral analytics or heatmaps

The only "analytics" we see are server-side logs for sync operations and AI API calls, which we use solely for debugging and infrastructure scaling.

---

## 2. App-Specific Privacy

Each TACo app collects different types of data depending on its purpose. Below is a detailed breakdown of what each app stores and how it handles your information.

### 2.1 Tempo (Time-Block Task Management)

**What Tempo Collects:**

- **Tasks:** Title, description, estimated duration, difficulty level, status, completion timestamps
- **Brain Dumps:** Raw text input you submit for AI processing
- **Sessions:** Daily work sessions with time boxes, start/end times, progress tracking
- **Timer State:** Currently active time box, time remaining, running status
- **Debrief Data:** Post-session reflections and notes

**AI Features:**

- When you use AI features (brain dump processing, task refinement), your text is sent to **Anthropic's Claude API** for processing.
- If you use **BYOK (Bring Your Own Key)**, your API key is stored locally in your browser (`tempo-api-config`) and never transmitted to TACo servers.
- If you use **Managed AI** (via Tempo Extras), TACo sends your task text to Claude on your behalf. We do not store or log the content processed.

**Storage:**

- All Tempo data is stored in your browser's localStorage under keys like `tempo-tasks`, `session-{date}`, `tempo-api-config`.

**Sync:**

- If you subscribe to Tempo Sync & Backup, your tasks, sessions, and settings are backed up to TACo servers.

---

### 2.2 Tenure (Career Companion & Job Application Tracker)

**What Tenure Collects:**

**User Profile:**

- Name, email, phone number, location
- LinkedIn URL, portfolio URL, professional summary
- Work experiences (company, job title, dates, descriptions, achievements, skills used)
- Education history (institution, degree, field of study, graduation date, GPA)
- Skills, certifications, keywords (technical, soft skills, industry terms, tools)

**Job Applications:**

- Company name, role name, job posting URL
- Job posting text (raw copy-paste)
- Location, remote/hybrid/onsite preference
- Salary information (min, max, currency, pay period)
- Application status history with timestamps
- Follow-up due dates, notes
- Contacts (recruiter name, role, email, LinkedIn)
- Documents (resume versions, cover letters)
- AI-powered analysis results (keyword matching, requirement matches, ATS scores)

**Resume Variants:**

- Target role, company, or job description
- Custom summaries, selected work experiences
- AI-generated content (tailored summaries, optimized bullet points)

**Career Journal (Prosper Module):**

- Current employment state (company, title, start date)
- Quarterly check-ins (job satisfaction scores, mood tracking, reflections)
- Accomplishments with metrics (shipped features, cost savings, team growth, etc.)
- Skills gained, certifications earned
- **Private notes** (explicitly marked as "never exported" for personal venting or sensitive thoughts)

**Career Assessment:**

- RIASEC Interest Profiler: 60 question responses
- RIASEC scores (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)

**AI Features:**

- **Resume Parsing:** When you upload a resume, we send the text to Claude for extraction and structuring.
- **Job Analysis:** Job posting text is sent to Claude for keyword extraction and requirement matching.
- **Resume Mutations:** AI-powered resume transformations (job-specific tailoring, role archetype transformations) send your resume content to Claude.

**Third-Party APIs:**

- **O\*NET API (U.S. Department of Labor):** Used for career matching, job outlook data, and salary ranges. We send your RIASEC scores to match you with suitable careers. This is a public government API with no personal data sharing beyond anonymous career interest scores.
- **Anthropic Claude API:** Used for resume intelligence and job matching.

**Storage:**

- Stored in localStorage under keys like `augment_pipeline_profile`, `augment_pipeline_applications`, `augment_answers`.

**Sync:**

- If you subscribe to Tenure Sync & Backup, your profile, applications, resume variants, and career journal (excluding private notes marked "never exported") are backed up to TACo servers.

---

### 2.3 FriendLy (Social Hangout Scheduling)

**What FriendLy Collects:**

**User Profile:**

- Unique identifier (UUID), username, display name
- Bio, avatar image
- Weekly availability schedule (day/time slots when you're open to hang out)
- Gamification stats (hangouts hosted/attended, friends made, streak weeks)

**Friends & Circles:**

- Friend names, email addresses (optional), avatars
- Friend availability schedules
- Friend groups ("Circles") with names, emojis, and member lists

**Hangout Requests:**

- Incoming hangout requests with requester name, email, note, requested time slot
- Request status (pending, accepted, declined)
- Privacy settings (open to friend groups, public visibility)

**Confirmed Hangouts (Bookings):**

- Scheduled time slot, hangout title
- Participant names and emails
- Host designation
- Notes, visibility settings

**Events:**

- Event title, description, emoji, date, time slot, location
- Host ID, invited friend IDs
- RSVPs (going, maybe, not going)
- Visibility (private, circle-only, public)

**Privacy Controls:**

- FriendLy offers **granular visibility settings**. You control whether hangouts are:
  - **Private** (only you and invited participants)
  - **Circle-only** (visible to specific friend groups)
  - **Public** (visible to anyone with your profile link)

**Storage:**

- Stored in localStorage under key `friendly_v2`.

**Sync:**

- If you subscribe to FriendLy Sync & Backup, your profile, friends, circles, hangouts, and events are backed up to TACo servers.

**Third-Party Integrations:**

- **None.** FriendLy operates entirely locally with no external API calls.

---

### 2.4 LOL (Labor of Love - Household Chore Management)

**What LOL Collects:**

**Household Members:**

- Names, avatars, assigned colors
- Points (total, weekly), streak counts, level
- Achievements unlocked

**Chores:**

- Chore name, category, estimated time (minutes)
- Points value, frequency (daily, weekly, etc.)
- Assigned household member

**Chore Completions:**

- Chore ID, user who completed it
- Start/end timestamps, actual duration
- Points earned
- Verification status and method (manual, sensor, photo)

**Rewards:**

- Reward title, description, points cost
- Creator, claimer, claim timestamp
- Reward type (personal, shared)

**Happiness Meter:**

- Household equity scores
- Member contribution percentages
- Completion rate trends

**Storage:**

- Stored in localStorage (specific key inferred from app patterns).

**Sync:**

- If you subscribe to LOL Sync & Backup, your household data is backed up to TACo servers.

**Third-Party Integrations:**

- **None.** LOL operates entirely locally.

---

### 2.5 Nurture (Relationship Cultivation & Contact CRM)

**What Nurture Collects:**

**Contacts:**

- Name, relationship type (family, friend, colleague, acquaintance)
- Last contact date, nurture cycle (how often you want to reach out, in days)
- Notes
- Growth stage (seedling, growing, flourishing, needs-water)

**Interactions:**

- Contact ID, interaction type (call, message, meetup, gift, thought)
- Date of interaction
- Interaction notes

**Storage:**

- Stored in localStorage (specific key inferred from app patterns).

**Sync:**

- If you subscribe to Nurture Sync & Backup, your contacts and interaction history are backed up to TACo servers.

**Sensitivity Notice:**

- Nurture stores **relationship data**, which may include sensitive personal information about your social network. We treat this data with the same care as all other local-first data.

**Third-Party Integrations:**

- **None currently.** Future mobile versions may integrate with calendar/contacts (with your explicit permission).

---

### 2.6 JustInCase (Small Claims Legal Case Management)

**What JustInCase Collects:**

**Cases:**

- Case title, status, claim amount
- Defendant name
- Filing date, court date
- Case description and background

**Evidence:**

- Evidence type (document, photo, receipt, correspondence, witness statement)
- Title, description
- Date added
- Highlight status (marked as important)

**Notes:**

- Case-related notes
- Highlight color
- Creation timestamp

**Storage:**

- Stored in localStorage (specific key inferred from app patterns).

**Sync:**

- If you subscribe to JustInCase Sync & Backup, your case data and evidence metadata (not actual files, as files are stored locally) are backed up to TACo servers.

**Sensitivity Notice:**

- JustInCase stores **legal case information**, which may be highly sensitive. We strongly recommend using this app only on devices you control. Consider encrypting your device and using strong passwords.

**Third-Party Integrations:**

- **None.** JustInCase operates entirely locally to protect the confidentiality of your legal information.

---

### 2.7 Manifest (Deep Connection & Values-Based Matching)

**What Manifest Collects:**

**User Profile:**

- Display name, age, location (city/region)
- Bio (max 500 characters)
- Photos (1-6 images)
- Commitment readiness score

**Matching Preferences:**

- Age range preferences
- Distance preferences
- Deal breakers (non-negotiables)
- Must-haves (required qualities)
- Values priorities (family, career, adventure, stability, creativity, spirituality, health, learning)

**Matches:**

- Matched user ID, compatibility score
- Shared values
- Match status (pending, accepted, passed, blind-date scheduled)
- Scheduled date details (if applicable)

**Self-Discovery Journal:**

- Personal reflection questions and your answers
- Categories (values, lifestyle, relationship goals, personality, emotional intelligence, boundaries)

**Extended Profile Data (for matching):**

- Love language, life path, core value
- Personal preferences and red flags you've disclosed

**Storage:**

- Stored in localStorage (specific key inferred from app patterns).

**Sync:**

- If you subscribe to Manifest Sync & Backup, your profile, journal, and match preferences are backed up to TACo servers.

**Sensitivity Notice:**

- Manifest stores **highly personal data**, including dating profiles, photos, personal values, and intimate self-reflections. We treat this data with the utmost care and never share it with third parties for any reason.

**Privacy & Visibility:**

- Your profile is only visible to others when you explicitly enable matching/discovery mode.
- You control which photos and profile details are visible to potential matches.

**Third-Party Integrations:**

- **None.** Manifest operates entirely locally to protect your privacy in the dating/relationship discovery space.

---

### 2.8 Augment (Career Discovery & RIASEC Assessment)

**Note:** Augment is integrated into the Tenure app as the **career discovery module**. See Section 2.2 (Tenure) for details on data collection and privacy.

---

## 3. Sync & Backup (Optional Paid Feature)

### 3.1 What Is Sync & Backup?

Sync & Backup is an **optional paid subscription** that allows you to:

- **Backup your app data** to TACo cloud servers
- **Sync across multiple devices** (desktop, mobile, tablet)
- **Restore data** if you lose a device or switch browsers

### 3.2 How Sync Works

When you subscribe to Sync & Backup for an app:

1. Your app data is **encrypted in transit** using HTTPS/TLS protocols.
2. Data is sent to TACo servers and stored in a secure database.
3. Changes sync **automatically** when you're online.
4. If you're offline, changes queue locally and sync when you reconnect.

### 3.3 What Gets Synced

The following data is synced based on which app subscription you have:

| App            | Synced Data                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tempo**      | Tasks, sessions, timer state, debrief notes, settings                                                                                                |
| **Tenure**     | Profile, work history, education, resume variants, job applications, RIASEC scores, career journal (excluding private notes marked "never exported") |
| **FriendLy**   | Profile, friends, circles, hangouts, events, availability schedule                                                                                   |
| **LOL**        | Household members, chores, completions, rewards, happiness metrics                                                                                   |
| **Nurture**    | Contacts, interactions, nurture settings                                                                                                             |
| **JustInCase** | Cases, evidence metadata, notes (actual evidence files remain local)                                                                                 |
| **Manifest**   | Profile, photos, matching preferences, journal entries, matches                                                                                      |

**Note:** API keys stored locally (e.g., Tempo BYOK keys) are **never synced** to TACo servers.

### 3.4 Data Retention After Cancellation

If you cancel your Sync & Backup subscription:

1. **Immediate:** We email you a **final backup** of your data (JSON export).
2. **Cold Storage:** Your data is archived for **2 years** in cold storage. This allows you to return and restore your data if you change your mind.
3. **After 2 Years:** Your cloud data is **permanently deleted**.
4. **Local Data:** Data in your browser is **never affected** by subscription cancellation. It stays on your device.

### 3.5 All Apps Sync Bundle

If you subscribe to **All Apps Sync & Backup** ($9/month), you get sync for all current and future TACo apps. This includes apps not yet released.

---

## 4. BYOK (Bring Your Own Key)

### 4.1 What Is BYOK?

Some TACo apps (Tempo, Tenure) offer AI-powered features that use **Anthropic's Claude API**. You have two options:

1. **BYOK (Bring Your Own Key):** Use your own Anthropic API key (free feature, you pay Anthropic directly for API usage).
2. **Managed AI:** Pay TACo for "Extras," and we manage the API keys for you.

### 4.2 How BYOK Works

When you choose BYOK:

- You enter your **Anthropic API key** into the app.
- The key is stored **locally in your browser** (e.g., `tempo-api-config` in localStorage).
- When you use AI features, the app sends requests **directly from your browser** to Anthropic's API using your key.
- **TACo servers never see your API key.**

### 4.3 BYOK Liability

When you use BYOK:

- **You are responsible** for API costs charged by Anthropic.
- **You are responsible** for compliance with Anthropic's terms of service.
- **We assume no liability** for how you use your API key or the results generated by Claude.
- **We do not log or store** the content you send to Claude via BYOK.

### 4.4 Managed AI (Alternative)

If you prefer not to manage API keys yourself, you can subscribe to **App Extras** (e.g., Tempo Extras, Tenure Extras). With Managed AI:

- TACo handles API keys and infrastructure.
- You pay a flat monthly fee or usage-based pricing (see pricing page).
- We send your content (tasks, resume text, job postings) to Claude on your behalf.
- **We do not log or store the content processed** by Claude.

---

## 5. TACo Account

### 5.1 Account Creation

To purchase TACo products and services (Sync, Extras, Loco TACo Club), you need to create a **TACo account** with an email address.

### 5.2 What We Collect

- **Email address** (required for account creation and billing)
- **Payment information** (processed by Stripe; we do not store credit card numbers)
- **Subscription status** (which apps/features you've subscribed to)
- **Billing history** (receipts and invoices)

### 5.3 How We Use Your Email

We use your email to:

- Send **payment receipts** and invoices
- Send **important product updates** (e.g., app updates, service changes, security notifications)
- Provide **customer support**

We **do not** use your email for:

- Marketing emails (unless you explicitly opt in)
- Selling or sharing with third parties (except payment processors)
- Spam or promotional content from third parties

### 5.4 Loco TACo Club

If you join the **Loco TACo Club** ($29/month for 24 months):

- You gain access to all TACo apps with Sync & Backup included.
- You receive 75% off all Extras forever after vesting (24 months).
- You may receive **exclusive merch** (physical items shipped to your address).
- You gain access to a **members-only community** (Discord or similar) where we may ask for feedback and input on the roadmap.

**Loco TACo Club Privacy:**

- If you provide a shipping address for merch, we store it only for fulfillment purposes.
- Community platform access (e.g., Discord) is subject to that platform's privacy policy.

### 5.5 Account Deletion

You can delete your TACo account at any time:

1. Log in to your account dashboard.
2. Navigate to **Settings → Delete Account**.
3. Confirm deletion.

**What happens when you delete your account:**

- Your email, payment history, and subscription records are **permanently deleted** within 30 days.
- Cloud-synced app data is **immediately deleted** (or archived per Section 3.4 if you had an active subscription).
- Local data in your browser is **not affected**—it remains on your device.
- Backup archives may be retained for **90 days** for disaster recovery, then permanently deleted.

---

## 6. Third-Party Services

### 6.1 We Do NOT Sell Your Data

We do not sell, trade, or rent your personal information to third parties for marketing purposes. Period.

### 6.2 Third-Party Service Providers

We share information with third-party service providers **only** to deliver our services:

| Service                              | Purpose                       | Data Shared                                                             |
| ------------------------------------ | ----------------------------- | ----------------------------------------------------------------------- |
| **Resend**                           | Email delivery                | Email address (for verification emails and account notifications)       |
| **Anthropic (Claude API)**           | AI processing (Tempo, Tenure) | Task text, resume content, job postings (only when you use AI features) |
| **O\*NET API (U.S. Dept. of Labor)** | Career matching (Tenure)      | RIASEC scores (anonymous career interest data)                          |
| **Stripe**                           | Payment processing            | Email, payment information, billing address                             |
| **PayPal** (if applicable)           | Payment processing            | Email, payment information                                              |

**No Advertising Partners:** We do not use Google Analytics, Facebook Pixel, or any other advertising/tracking services.

### 6.3 Resend (Email Delivery Service)

We use **Resend** to send transactional emails, including:

- Magic link verification emails (passwordless authentication)
- Payment receipts and billing notifications
- Important account and security updates

**What data does Resend process?**

- Your email address (to deliver messages)
- Email metadata (timestamps, delivery status)

**What Resend does NOT receive:**

- We do not share your app data, sync data, or any personal information beyond your email address
- Resend does not have access to your TACo account details, subscription information, or app usage

Resend is a transactional email service provider and does not use your email address for marketing purposes. Their privacy policy: https://resend.com/legal/privacy-policy

### 6.4 Anthropic Claude API

When you use AI features in Tempo or Tenure:

- We send **only the specific content you're processing** (e.g., a task description, resume text, job posting).
- We **do not send your entire data vault** or any data unrelated to the feature you're using.
- We **do not log or store** the content sent to Claude or the responses received.
- Anthropic's privacy policy governs how they handle data sent to their API. See: https://www.anthropic.com/legal/privacy

### 6.5 O\*NET API

Tenure uses the **O\*NET API** (U.S. Department of Labor) to match your RIASEC career interest scores with suitable careers and provide job outlook data.

- We send **only your RIASEC scores** (6 numerical values representing career interests).
- This is **anonymous data**—no personal identifiers are sent.
- O\*NET is a public government database with no data retention or privacy concerns.

### 6.6 Payment Processors

We use **Stripe** (and optionally PayPal) to process payments. When you purchase a subscription or join Loco TACo Club:

- Your **payment information** (credit card, billing address) is sent directly to Stripe.
- We **do not store** credit card numbers or full payment details.
- We store only a **Stripe customer ID** to manage your subscriptions.

Stripe's privacy policy: https://stripe.com/privacy

---

## 7. Data Security

### 7.1 Encryption

- **Data in transit:** All communications between your browser and TACo servers use **HTTPS/TLS encryption**.
- **Data at rest:** Cloud-synced data is stored in encrypted databases.
- **Local storage:** Data in your browser's localStorage is protected by your device's security settings (lock screen, disk encryption, etc.).

### 7.2 Access Controls

- Only **authorized TACo personnel** have access to cloud-synced data, and only for:
  - Debugging sync issues
  - Customer support requests
  - Infrastructure maintenance
- We do **not** access, read, or analyze your app data for marketing, product development, or any other purpose.

### 7.3 No Guarantee

**Important:** No security system is impenetrable. While we strive to protect your data using industry-standard practices, we cannot guarantee absolute security. You are responsible for:

- Using strong passwords
- Keeping your devices secure (lock screens, disk encryption)
- Not sharing your TACo account credentials

---

## 8. Data Retention

### 8.1 Free Tier (Local-Only)

If you use TACo apps **without subscribing to Sync & Backup**:

- Your data stays in your browser's localStorage **forever** (or until you clear browser data).
- We **never see or store** your data on our servers.

### 8.2 Paid Tier (Sync & Backup)

If you subscribe to Sync & Backup:

- **Active Subscription:** Your data is stored on TACo servers and synced across devices as long as your subscription is active.
- **After Cancellation:** See Section 3.4 (email backup + 2-year cold storage).

### 8.3 Inactive Accounts

If your TACo account is **inactive for 12 months** (no login, no active subscriptions), we may:

- Send you an email notification warning of account deletion.
- Delete your account and cloud-synced data after **12 months of inactivity**.
- Local data on your devices is **not affected**.

### 8.4 Backup Archives

After you delete your account or cancel subscriptions, we retain **backup archives** for up to **90 days** for disaster recovery purposes, then permanently delete them.

---

## 9. Your Rights and Choices

### 9.1 Access and Portability

You have the right to:

- **Access** your personal data stored by TACo (via account dashboard).
- **Export** your data at any time (free CSV/JSON export in all apps).

### 9.2 Correction and Deletion

You can:

- **Correct** your account information through the account dashboard.
- **Delete** your account and all associated data (see Section 5.5).

### 9.3 Opt-Out Options

- **Marketing Communications:** We send only essential emails (receipts, product updates). You can opt out of non-essential emails by clicking "unsubscribe."
- **Cookies:** TACo apps use minimal cookies for session management. You can disable cookies in your browser, though this may break login functionality.

### 9.4 Do Not Track

If your browser sends a "Do Not Track" signal, we respect it. However, since we don't track users anyway, this has no practical effect.

### 9.5 Regional Rights

#### GDPR (EU/UK)

If you're in the EU or UK, you have the right to:

- **Access** your personal data
- **Rectify** inaccurate data
- **Erase** your data ("right to be forgotten")
- **Port** your data to another service
- **Object** to data processing
- **Restrict** processing

To exercise these rights, contact us at launch@thoughtfulapp.co.

#### CCPA (California)

If you're a California resident, you have the right to:

- **Know** what personal data we collect
- **Delete** your personal data
- **Opt-out** of data sales (we don't sell data, so this doesn't apply)

To exercise these rights, contact us at launch@thoughtfulapp.co.

#### Other Jurisdictions

We comply with applicable privacy laws in all jurisdictions where we operate.

---

## 10. Children's Privacy

TACo apps are **not intended for children under 13**. We do not knowingly collect personal information from children under 13.

If we become aware that a child under 13 has provided us with personal information, we will:

- Delete the information immediately
- Terminate the child's account (if applicable)

Parents or guardians concerned about a child's data should contact us immediately at launch@thoughtfulapp.co.

---

## 11. International Data Transfers

If you access TACo apps from outside the United States, be aware that:

- Your information may be **transferred to, stored in, and processed in the United States** or other countries where our servers are located.
- These countries may have data protection laws different from your country of residence.
- By using TaCo apps, you consent to this transfer.

---

## 12. Third-Party Links and Services

TaCo apps may contain links to third-party websites and services (e.g., job posting URLs in Tenure, LinkedIn profiles in FriendLy). We are **not responsible** for their privacy practices. Please review their privacy policies before using their services.

---

## 13. Contact Us

For privacy-related questions, data requests, or to exercise your rights, please contact:

**Thoughtful App Co.**  
Represented by: Erikk Shupp  
Email: launch@thoughtfulapp.co

We will respond to all privacy inquiries within **30 days**.

---

## 14. Policy Updates

We may update this Privacy Policy from time to time. We will notify you of material changes by:

- Posting the updated policy on the TaCo website and apps
- Updating the "Last Updated" date at the top of this document
- Sending a notification to your registered email address (for material changes affecting your rights)

Your continued use of TaCo apps after updates constitutes acceptance of the revised Privacy Policy.

---

## 15. Governing Law

This Privacy Policy is governed by the laws of the United States. Any disputes arising from this policy are subject to the exclusive jurisdiction of the courts in [State/Federal jurisdiction to be determined].

---

## Version History

- **December 26, 2025:** Major update. Restructured with user-friendly summary, app-specific sections, and enhanced local-first messaging. Added sections for Sync & Backup, BYOK, and all 8 TACo apps.
- **December 2, 2025:** Initial version (v1.0).

---

**Document Version:** 2.0  
**Next Review Date:** December 26, 2026
