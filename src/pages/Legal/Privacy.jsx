import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-display font-bold text-accent-gold mb-3">{title}</h2>
    <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface-dark py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-display font-bold text-accent-gold mb-2">Privacy Policy</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: March 14, 2026</p>

        <Section title="1. Overview">
          <p>
            Kaboona FC ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, store, and share your personal information when you use the
            Kaboona FC website, application, and services (the "Platform").
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p><strong className="text-white/90">Account Information:</strong> When you register, we collect your
            name, email address, password, nationality (optional), and selected role (player, fan, coach).</p>
          <p><strong className="text-white/90">Profile Information:</strong> Players may provide additional details
            such as position, jersey number, height, weight, date of birth, and profile photo.</p>
          <p><strong className="text-white/90">Payment Information:</strong> When you make purchases or pay training
            fees, payment details are processed by Stripe. We do not store your full card number on our servers.</p>
          <p><strong className="text-white/90">Usage Data:</strong> We collect information about how you interact
            with the Platform, including pages visited, features used, voting activity, and prediction submissions.</p>
          <p><strong className="text-white/90">User Content:</strong> Photos, comments, and posts you upload to
            the Fan Wall, Gallery, or other community features.</p>
          <p><strong className="text-white/90">Authentication Data:</strong> If you sign in with Google or Apple,
            we receive your name and email address from those services.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide and operate the Platform's features</li>
            <li>Manage your account, role, and access permissions</li>
            <li>Process payments and training registrations</li>
            <li>Display leaderboards, match statistics, and player profiles</li>
            <li>Send club communications (match updates, training schedules, announcements)</li>
            <li>Facilitate POTM voting, predictions, and fan engagement features</li>
            <li>Improve the Platform and develop new features</li>
            <li>Prevent fraud and enforce our Terms & Conditions</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white/90">Service Providers:</strong> Supabase (database & authentication),
              Stripe (payments), Cloudflare (storage & delivery) — each bound by their own privacy policies</li>
            <li><strong className="text-white/90">Club Staff:</strong> Coaches and admins can view player profiles,
              attendance records, and training data to manage the club</li>
            <li><strong className="text-white/90">Public Display:</strong> Player names, positions, and stats may
              be displayed on public-facing pages (team roster, match results). Fan Wall posts and gallery photos
              are visible to other registered users</li>
            <li><strong className="text-white/90">Legal Requirements:</strong> We may disclose information if
              required by law or to protect the rights and safety of Kaboona FC and its members</li>
          </ul>
        </Section>

        <Section title="5. Data Storage & Security">
          <p>
            Your data is stored on secure servers provided by Supabase (hosted infrastructure). We use
            encryption in transit (HTTPS/TLS) and at rest. Access to personal data is restricted to authorised
            personnel who need it to operate the Platform.
          </p>
          <p>
            While we take reasonable measures to protect your data, no system is completely secure. You are
            responsible for keeping your login credentials confidential.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your account data for as long as your account is active. If you delete your account,
            we will remove your personal information within 30 days, except where we are required to retain
            it for legal or accounting purposes. Anonymised or aggregated data (e.g., match statistics) may
            be retained indefinitely.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white/90">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-white/90">Correction</strong> — update or correct inaccurate information via your profile settings</li>
            <li><strong className="text-white/90">Deletion</strong> — request deletion of your account and associated data</li>
            <li><strong className="text-white/90">Portability</strong> — request your data in a machine-readable format</li>
            <li><strong className="text-white/90">Objection</strong> — opt out of non-essential communications</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:info@kaboona.com" className="text-accent-gold hover:text-accent-gold-light">
              info@kaboona.com
            </a>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use essential cookies and local storage to maintain your session and preferences. For full
            details, see our{' '}
            <Link to="/cookies" className="text-accent-gold hover:text-accent-gold-light">Cookie Policy</Link>.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            The Platform is not intended for children under 13. We do not knowingly collect personal
            information from children under 13. Users aged 13–17 must have parental consent to use the
            Platform.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            via email or in-app notification. Continued use of the Platform constitutes acceptance of the
            updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:info@kaboona.com" className="text-accent-gold hover:text-accent-gold-light">
              info@kaboona.com
            </a>.
          </p>
        </Section>
      </motion.div>
    </div>
  );
}
