import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Step 5: Payment plan selection and Stripe form
 */
class PaymentStep extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cardNumber: '',
      expiryDate: '',
      cvc: '',
      cardName: '',
      isProcessing: false,
    };
  }

  formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  handleCardInput = (e) => {
    const { name, value } = e.target;

    if (name === 'cardNumber') {
      this.setState({ cardNumber: this.formatCardNumber(value) });
    } else if (name === 'expiryDate') {
      this.setState({ expiryDate: this.formatExpiryDate(value) });
    } else if (name === 'cvc') {
      this.setState({ cvc: value.replace(/[^0-9]/g, '').substring(0, 4) });
    } else {
      this.setState({ [name]: value });
    }
  };

  render() {
    const { data, onChange, errors } = this.props;
    const { cardNumber, expiryDate, cvc, cardName } = this.state;

    const plans = [
      {
        id: 'monthly',
        name: 'Monthly',
        price: 100,
        period: 'month',
        features: [
          'Weekly training sessions',
          'Access to training facilities',
          'Jersey and kit included',
          'Match participation',
        ],
      },
      {
        id: 'yearly',
        name: 'Yearly',
        price: 960,
        originalPrice: 1200,
        period: 'year',
        savings: 240,
        discount: '20%',
        popular: true,
        features: [
          'Everything in Monthly',
          'Priority match selection',
          'Exclusive team events',
          'Performance analytics',
          'Personalized coaching feedback',
        ],
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Choose Your Plan
          </h2>
          <p className="text-white/60">
            Select a training membership that fits your commitment
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              onClick={() => onChange({ target: { name: 'plan', value: plan.id } })}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                data.plan === plan.id
                  ? 'border-accent-gold bg-accent-gold/5'
                  : 'border-white/10 bg-surface-dark hover:border-white/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-accent-gold text-black text-xs font-bold rounded-full">
                    BEST VALUE
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
                <div className="mt-2">
                  {plan.originalPrice && (
                    <span className="text-sm text-white/40 line-through mr-2">
                      RM {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-3xl font-display font-bold text-accent-gold">
                    RM {plan.price}
                  </span>
                  <span className="text-white/60">/{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="mt-1 text-sm text-green-400 font-medium">
                    Save RM {plan.savings} ({plan.discount} off)
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-white/80">
                    <svg
                      className="w-4 h-4 mr-2 text-accent-gold flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Selection Indicator */}
              <div
                className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  data.plan === plan.id
                    ? 'border-accent-gold bg-accent-gold'
                    : 'border-white/30'
                }`}
              >
                {data.plan === plan.id && (
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {errors.plan && (
          <p className="text-sm text-red-400 text-center">{errors.plan}</p>
        )}

        {/* Payment Form */}
        <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-accent-gold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <h3 className="text-lg font-display font-semibold text-white">
              Secure Payment
            </h3>
            <div className="ml-auto flex gap-2">
              {/* Payment Icons */}
              <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                <svg className="w-8 h-4" viewBox="0 0 50 16" fill="none">
                  <rect width="50" height="16" rx="2" fill="#1A1F71"/>
                  <text x="25" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">VISA</text>
                </svg>
              </div>
              <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                <svg className="w-8 h-4" viewBox="0 0 50 16" fill="none">
                  <circle cx="18" cy="8" r="7" fill="#EB001B"/>
                  <circle cx="32" cy="8" r="7" fill="#F79E1B"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cardNumber"
                  value={cardNumber}
                  onChange={this.handleCardInput}
                  maxLength="19"
                  className="w-full px-4 py-3 pl-12 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="1234 5678 9012 3456"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={expiryDate}
                  onChange={this.handleCardInput}
                  maxLength="5"
                  className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="MM/YY"
                />
              </div>

              {/* CVC */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  CVC
                </label>
                <input
                  type="text"
                  name="cvc"
                  value={cvc}
                  onChange={this.handleCardInput}
                  maxLength="4"
                  className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="123"
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardName"
                value={cardName}
                onChange={this.handleCardInput}
                className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                placeholder="Name on card"
              />
            </div>
          </div>

          {/* Stripe Badge */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-white/40">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            <span className="text-xs">Powered by Stripe - Secure & Encrypted</span>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={data.acceptTerms}
            onChange={onChange}
            className="mt-1 w-4 h-4 bg-background-dark border-white/20 rounded text-accent-gold focus:ring-accent-gold focus:ring-offset-surface-dark"
          />
          <label htmlFor="acceptTerms" className="text-sm text-white/60">
            I agree to the{' '}
            <a href="/terms" className="text-accent-gold hover:text-accent-gold-light">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-accent-gold hover:text-accent-gold-light">
              Privacy Policy
            </a>
.
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-400">{errors.acceptTerms}</p>
        )}
      </motion.div>
    );
  }
}

export default PaymentStep;
