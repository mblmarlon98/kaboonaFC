import React, { Component } from 'react';
import { motion } from 'framer-motion';

class DonationForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAmount: 50,
      customAmount: '',
      isCustom: false,
      name: '',
      email: '',
      message: '',
      isSubmitting: false,
      submitted: false,
      error: null,
    };
  }

  predefinedAmounts = [20, 50, 100, 500];

  handleAmountSelect = (amount) => {
    this.setState({
      selectedAmount: amount,
      isCustom: false,
      customAmount: '',
    });
  };

  handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    this.setState({
      customAmount: value,
      isCustom: true,
      selectedAmount: parseInt(value) || 0,
    });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, error: null });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, selectedAmount } = this.state;

    if (!name || !email) {
      this.setState({ error: 'Please fill in your name and email' });
      return;
    }

    if (selectedAmount < 1) {
      this.setState({ error: 'Please select or enter a donation amount' });
      return;
    }

    this.setState({ isSubmitting: true, error: null });

    // Simulate API call
    setTimeout(() => {
      this.setState({
        isSubmitting: false,
        submitted: true,
      });
    }, 1500);
  };

  resetForm = () => {
    this.setState({
      selectedAmount: 50,
      customAmount: '',
      isCustom: false,
      name: '',
      email: '',
      message: '',
      submitted: false,
      error: null,
    });
  };

  render() {
    const {
      selectedAmount,
      customAmount,
      isCustom,
      name,
      email,
      message,
      isSubmitting,
      submitted,
      error,
    } = this.state;

    if (submitted) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-dark-elevated rounded-xl p-8 border border-accent-gold/20 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 bg-accent-gold/20 rounded-full flex items-center justify-center"
          >
            <svg
              className="w-10 h-10 text-accent-gold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
          <h3 className="text-2xl font-display font-bold text-white mb-2">
            Thank You!
          </h3>
          <p className="text-white/60 mb-6">
            Your donation of RM {selectedAmount} has been received. You are now part of the Kaboona FC family!
          </p>
          <button
            onClick={this.resetForm}
            className="px-6 py-2 bg-accent-gold/20 text-accent-gold rounded-lg hover:bg-accent-gold/30 transition-colors"
          >
            Make Another Donation
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-surface-dark-elevated rounded-xl p-8 border border-white/10"
      >
        <h3 className="text-2xl font-display font-bold text-white mb-6">
          One-Time Donation
        </h3>

        {/* Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-3">
            Select Amount (RM)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {this.predefinedAmounts.map((amount) => (
              <motion.button
                key={amount}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => this.handleAmountSelect(amount)}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedAmount === amount && !isCustom
                    ? 'bg-accent-gold text-black'
                    : 'bg-white/5 text-white border border-white/10 hover:border-accent-gold/50'
                }`}
              >
                RM {amount}
              </motion.button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              RM
            </span>
            <input
              type="text"
              value={customAmount}
              onChange={this.handleCustomAmountChange}
              placeholder="Custom amount"
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                isCustom ? 'border-accent-gold' : 'border-white/10'
              }`}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form Fields */}
        <form onSubmit={this.handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Your Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={this.handleInputChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={this.handleInputChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={message}
              onChange={this.handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors resize-none"
              placeholder="Leave a message of support..."
            />
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              `Donate RM ${selectedAmount || 0}`
            )}
          </motion.button>
        </form>

        <p className="mt-4 text-center text-white/40 text-sm">
          Secure payment powered by Stripe
        </p>
      </motion.div>
    );
  }
}

export default DonationForm;
