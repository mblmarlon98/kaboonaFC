import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-display font-bold text-accent-gold mb-3">{title}</h2>
    <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function Refund() {
  return (
    <div className="min-h-screen bg-surface-dark py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-display font-bold text-accent-gold mb-2">Refund Policy</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: March 14, 2026</p>

        <Section title="1. Training Fees">
          <p>
            Training membership fees (monthly or yearly plans) are non-refundable once the billing period
            has begun, except in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white/90">Medical reasons:</strong> If a player is unable to
              participate due to injury or illness (medical certificate required), a pro-rata credit may
              be applied to future billing periods</li>
            <li><strong className="text-white/90">Club cancellation:</strong> If Kaboona FC cancels training
              sessions for an extended period, affected members will receive a pro-rata refund or credit</li>
            <li><strong className="text-white/90">Within 7 days:</strong> New members may request a full
              refund within 7 days of their first payment if they have not attended any training sessions</li>
          </ul>
        </Section>

        <Section title="2. Merchandise">
          <p>
            Merchandise purchased through the Kaboona FC Shop may be returned or exchanged within 14 days
            of delivery, provided the items are:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Unused, unworn, and in original packaging</li>
            <li>Not personalised or custom-printed</li>
            <li>Accompanied by proof of purchase</li>
          </ul>
          <p>
            Refunds will be processed to the original payment method within 7–14 business days. Shipping
            costs are non-refundable unless the return is due to a defect or error on our part.
          </p>
        </Section>

        <Section title="3. Donations & Sponsorships">
          <p>
            Donations and sponsorship contributions made through the Investors page are voluntary and
            non-refundable. If you believe a charge was made in error, please contact us within 48 hours.
          </p>
        </Section>

        <Section title="4. How to Request a Refund">
          <p>
            To request a refund, email us at{' '}
            <a href="mailto:info@kaboona.com" className="text-accent-gold hover:text-accent-gold-light">
              info@kaboona.com
            </a>{' '}
            with your order or membership details. We aim to respond within 3 business days.
          </p>
        </Section>

        <Section title="5. Disputes">
          <p>
            If you are unsatisfied with our refund decision, you may escalate the matter by contacting us
            directly. We are committed to resolving disputes fairly. Our full{' '}
            <Link to="/terms" className="text-accent-gold hover:text-accent-gold-light">Terms & Conditions</Link>{' '}
            apply to all transactions.
          </p>
        </Section>
      </motion.div>
    </div>
  );
}
