import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-display font-bold text-accent-gold mb-3">{title}</h2>
    <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function Cookies() {
  return (
    <div className="min-h-screen bg-surface-dark py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-display font-bold text-accent-gold mb-2">Cookie Policy</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: March 14, 2026</p>

        <Section title="1. What Are Cookies?">
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the
            site remember your preferences and understand how you interact with it. We also use similar
            technologies such as local storage.
          </p>
        </Section>

        <Section title="2. Cookies We Use">
          <p>The Kaboona FC Platform uses the following types of cookies and storage:</p>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/90 font-medium">Type</th>
                  <th className="text-left py-2 pr-4 text-white/90 font-medium">Purpose</th>
                  <th className="text-left py-2 text-white/90 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Authentication</td>
                  <td className="py-2 pr-4">Keep you signed in and manage your session</td>
                  <td className="py-2">Session / 1 hour</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Preferences</td>
                  <td className="py-2 pr-4">Remember your settings (e.g., dark mode, language)</td>
                  <td className="py-2">Persistent</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Supabase Auth</td>
                  <td className="py-2 pr-4">Manage authentication tokens and session refresh</td>
                  <td className="py-2">Session / 1 hour</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Stripe</td>
                  <td className="py-2 pr-4">Fraud prevention during payment processing</td>
                  <td className="py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. What We Don't Use">
          <p>
            We do <strong className="text-white/90">not</strong> use:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Third-party advertising or tracking cookies</li>
            <li>Analytics cookies (e.g., Google Analytics)</li>
            <li>Social media tracking pixels</li>
          </ul>
        </Section>

        <Section title="4. Managing Cookies">
          <p>
            You can control cookies through your browser settings. Disabling essential cookies (authentication,
            Supabase) will prevent you from signing in and using the Platform. Clearing local storage will
            sign you out.
          </p>
        </Section>

        <Section title="5. Changes">
          <p>
            If we introduce new cookie types (e.g., analytics), we will update this policy and notify users
            accordingly.
          </p>
        </Section>

        <Section title="6. More Information">
          <p>
            For questions about our use of cookies, see our{' '}
            <Link to="/privacy" className="text-accent-gold hover:text-accent-gold-light">Privacy Policy</Link>{' '}
            or contact us at{' '}
            <a href="mailto:info@kaboona.com" className="text-accent-gold hover:text-accent-gold-light">
              info@kaboona.com
            </a>.
          </p>
        </Section>
      </motion.div>
    </div>
  );
}
