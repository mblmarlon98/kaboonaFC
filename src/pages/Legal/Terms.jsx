import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-display font-bold text-accent-gold mb-3">{title}</h2>
    <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function Terms() {
  return (
    <div className="min-h-screen bg-surface-dark py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-display font-bold text-accent-gold mb-2">Terms & Conditions</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: March 14, 2026</p>

        <Section title="1. Introduction">
          <p>
            Welcome to Kaboona FC. These Terms and Conditions ("Terms") govern your use of the Kaboona FC
            website, mobile application, and all related services (collectively, the "Platform"). By creating
            an account or using the Platform, you agree to be bound by these Terms.
          </p>
          <p>
            Kaboona FC is a football club based in Malaysia. The Platform serves our players, fans, coaching
            staff, and supporters by providing match information, training management, fan engagement, merchandise
            sales, and community features.
          </p>
        </Section>

        <Section title="2. Eligibility & Accounts">
          <p>
            You must be at least 13 years of age to create an account. If you are under 18, you must have
            parental or guardian consent. You are responsible for maintaining the confidentiality of your
            account credentials and for all activity under your account.
          </p>
          <p>
            You agree to provide accurate, current, and complete information during registration and to keep
            your profile information up to date. Kaboona FC reserves the right to suspend or terminate accounts
            that contain false or misleading information.
          </p>
        </Section>

        <Section title="3. User Roles & Access">
          <p>
            The Platform supports multiple user roles including Player, Fan, Coach, and Admin. Each role provides
            access to different features. Your role is assigned during registration or by a club administrator.
            Misrepresenting your role or attempting to access features beyond your assigned permissions is prohibited.
          </p>
        </Section>

        <Section title="4. Training & Membership">
          <p>
            Players who register for training sessions agree to the training schedule, fees, and club rules
            communicated at the time of registration. Training fees are billed according to the selected plan
            (monthly or yearly). Attendance policies and squad selection are at the discretion of the coaching staff.
          </p>
          <p>
            Kaboona FC reserves the right to modify training schedules, fees, and membership terms with
            reasonable notice to affected members.
          </p>
        </Section>

        <Section title="5. Fan Portal & Community Features">
          <p>
            The Fan Portal includes features such as the Fan Wall, Player of the Match (POTM) voting, score
            predictions, leaderboards, and photo galleries. By participating, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Post content that is respectful and appropriate</li>
            <li>Not engage in spam, harassment, hate speech, or abusive behaviour</li>
            <li>Not impersonate other users, players, or staff</li>
            <li>Accept that leaderboard rankings and POTM results are determined by the Platform's scoring system</li>
          </ul>
          <p>
            Kaboona FC reserves the right to remove content and suspend accounts that violate community standards
            without prior notice.
          </p>
        </Section>

        <Section title="6. Shop & Payments">
          <p>
            Merchandise and services purchased through the Platform are subject to availability. Prices are
            displayed in Malaysian Ringgit (MYR) unless otherwise stated. Payments are processed securely
            through our third-party payment provider (Stripe).
          </p>
          <p>
            By making a purchase, you agree to provide valid payment information. All sales are subject to
            our <Link to="/refund" className="text-accent-gold hover:text-accent-gold-light">Refund Policy</Link>.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content on the Platform — including the Kaboona FC name, logo, designs, graphics, match data,
            and software — is the property of Kaboona FC or its licensors and is protected by intellectual
            property laws. You may not reproduce, distribute, or create derivative works without prior written
            permission.
          </p>
          <p>
            Content you upload (photos, posts, comments) remains yours, but you grant Kaboona FC a non-exclusive,
            royalty-free licence to use, display, and distribute that content on the Platform and in club
            communications (e.g., social media, newsletters).
          </p>
        </Section>

        <Section title="8. Privacy & Data">
          <p>
            Your use of the Platform is also governed by our{' '}
            <Link to="/privacy" className="text-accent-gold hover:text-accent-gold-light">Privacy Policy</Link>,
            which describes how we collect, use, and protect your personal information.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            The Platform is provided "as is" without warranties of any kind. Kaboona FC shall not be liable
            for any indirect, incidental, or consequential damages arising from your use of the Platform. Our
            total liability for any claim related to the Platform shall not exceed the amount you have paid to
            Kaboona FC in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title="10. Modifications">
          <p>
            Kaboona FC may update these Terms at any time. We will notify registered users of material changes
            via email or an in-app notification. Continued use of the Platform after changes take effect
            constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by the laws of Malaysia. Any disputes shall be resolved in the courts of
            Malaysia.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>
            If you have questions about these Terms, contact us at{' '}
            <a href="mailto:info@kaboona.com" className="text-accent-gold hover:text-accent-gold-light">
              info@kaboona.com
            </a>.
          </p>
        </Section>
      </motion.div>
    </div>
  );
}
