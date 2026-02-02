import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StepIndicator from './components/StepIndicator';
import AccountStep from './components/AccountStep';
import PersonalInfoStep from './components/PersonalInfoStep';
import PlayerInfoStep from './components/PlayerInfoStep';
import StatsStep from './components/StatsStep';
import PaymentStep from './components/PaymentStep';
import { signUp, signIn } from '../../services/auth';
import { setUser, setSession, setError } from '../../redux/slices/authSlice';

/**
 * Multi-step Training Signup wizard
 * Steps: Account -> Personal Info -> Player Info -> Stats -> Payment
 */
class TrainingSignup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 1,
      isSubmitting: false,
      submitError: null,
      submitSuccess: false,
      formData: {
        // Step 1: Account
        email: '',
        password: '',
        confirmPassword: '',
        // Step 2: Personal Info
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        // Step 3: Player Info
        position: 'ST',
        jerseyNumber: '',
        preferredFoot: 'right',
        height: '',
        weight: '',
        weakFoot: 3,
        // Step 4: Stats
        stats: {
          pace: 50,
          shooting: 50,
          passing: 50,
          dribbling: 50,
          defending: 50,
          physical: 50,
          // GK stats
          diving: 50,
          handling: 50,
          kicking: 50,
          reflexes: 50,
          speed: 50,
          positioning: 50,
        },
        // Step 5: Payment
        plan: 'yearly',
        acceptTerms: false,
      },
      errors: {},
    };
  }

  steps = [
    { id: 1, label: 'Account' },
    { id: 2, label: 'Personal' },
    { id: 3, label: 'Player' },
    { id: 4, label: 'Stats' },
    { id: 5, label: 'Payment' },
  ];

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested stats object
    if (name.startsWith('stats.')) {
      const statKey = name.split('.')[1];
      this.setState((prevState) => ({
        formData: {
          ...prevState.formData,
          stats: {
            ...prevState.formData.stats,
            [statKey]: value,
          },
        },
        errors: {
          ...prevState.errors,
          stats: null,
        },
      }));
      return;
    }

    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        [name]: type === 'checkbox' ? checked : value,
      },
      errors: {
        ...prevState.errors,
        [name]: null,
      },
    }));
  };

  validateStep = (step) => {
    const { formData } = this.state;
    const errors = {};

    switch (step) {
      case 1: // Account
        if (!formData.email) {
          errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
          errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 2: // Personal Info
        if (!formData.fullName) {
          errors.fullName = 'Full name is required';
        }
        if (!formData.phone) {
          errors.phone = 'Phone number is required';
        }
        if (!formData.dateOfBirth) {
          errors.dateOfBirth = 'Date of birth is required';
        }
        if (!formData.gender) {
          errors.gender = 'Please select a gender';
        }
        if (!formData.emergencyContactName) {
          errors.emergencyContactName = 'Emergency contact name is required';
        }
        if (!formData.emergencyContactPhone) {
          errors.emergencyContactPhone = 'Emergency contact phone is required';
        }
        break;

      case 3: // Player Info
        if (!formData.position) {
          errors.position = 'Please select a position';
        }
        if (!formData.jerseyNumber) {
          errors.jerseyNumber = 'Jersey number is required';
        } else if (formData.jerseyNumber < 1 || formData.jerseyNumber > 99) {
          errors.jerseyNumber = 'Jersey number must be between 1 and 99';
        }
        if (!formData.preferredFoot) {
          errors.preferredFoot = 'Please select your preferred foot';
        }
        break;

      case 4: // Stats - basic validation
        // Stats are optional, can proceed
        break;

      case 5: // Payment
        if (!formData.plan) {
          errors.plan = 'Please select a plan';
        }
        if (!formData.acceptTerms) {
          errors.acceptTerms = 'You must accept the terms to continue';
        }
        break;

      default:
        break;
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleNext = async () => {
    const { currentStep } = this.state;

    if (!this.validateStep(currentStep)) {
      return;
    }

    // If on step 1, attempt to create account
    if (currentStep === 1) {
      this.setState({ isSubmitting: true, submitError: null });
      const { formData } = this.state;
      const { setUser, setSession, setError } = this.props;

      try {
        const { data, error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName || 'New Player',
          role: 'player',
        });

        if (error) {
          // If user already exists, try to sign in
          if (error.message.includes('already registered')) {
            const signInResult = await signIn(formData.email, formData.password);
            if (signInResult.error) {
              this.setState({
                isSubmitting: false,
                errors: { email: signInResult.error.message },
              });
              return;
            }
            if (signInResult.data?.user) {
              setUser(signInResult.data.user);
              setSession(signInResult.data.session);
            }
          } else {
            this.setState({
              isSubmitting: false,
              errors: { email: error.message },
            });
            return;
          }
        }

        if (data?.user) {
          setUser(data.user);
          setSession(data.session);
        }
      } catch (err) {
        this.setState({
          isSubmitting: false,
          submitError: 'An unexpected error occurred',
        });
        return;
      }

      this.setState({ isSubmitting: false });
    }

    // Move to next step
    this.setState((prevState) => ({
      currentStep: Math.min(prevState.currentStep + 1, 5),
    }));
  };

  handleBack = () => {
    this.setState((prevState) => ({
      currentStep: Math.max(prevState.currentStep - 1, 1),
    }));
  };

  handleSubmit = async () => {
    const { currentStep } = this.state;

    if (!this.validateStep(currentStep)) {
      return;
    }

    this.setState({ isSubmitting: true, submitError: null });

    // Simulate payment processing (mock for now)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app, you would:
    // 1. Create Stripe payment intent
    // 2. Process the payment
    // 3. Save player data to database
    // 4. Send confirmation email

    this.setState({
      isSubmitting: false,
      submitSuccess: true,
    });
  };

  renderStep = () => {
    const { currentStep, formData, errors } = this.state;

    switch (currentStep) {
      case 1:
        return (
          <AccountStep
            data={formData}
            onChange={this.handleChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            data={formData}
            onChange={this.handleChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <PlayerInfoStep
            data={formData}
            onChange={this.handleChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <StatsStep
            data={formData}
            onChange={this.handleChange}
            errors={errors}
          />
        );
      case 5:
        return (
          <PaymentStep
            data={formData}
            onChange={this.handleChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { currentStep, isSubmitting, submitError, submitSuccess, formData } = this.state;

    // Show success screen
    if (submitSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background-dark">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg text-center"
          >
            <div className="bg-surface-dark rounded-2xl p-8 border border-white/10">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-10 h-10 text-green-500"
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
              </motion.div>

              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Welcome to Kaboona FC!
              </h1>
              <p className="text-white/60 mb-6">
                Your registration is complete. Check your email for training schedule details.
              </p>

              <div className="bg-accent-gold/5 border border-accent-gold/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-accent-gold">
                  <strong>Plan:</strong> {formData.plan === 'yearly' ? 'Yearly' : 'Monthly'} -
                  RM {formData.plan === 'yearly' ? '960' : '100'}/{formData.plan === 'yearly' ? 'year' : 'month'}
                </p>
              </div>

              <div className="flex gap-4">
                <motion.a
                  href="/profile"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors text-center"
                >
                  View Profile
                </motion.a>
                <motion.a
                  href="/"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-4 bg-white/5 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-center"
                >
                  Back to Home
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-background-dark">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-accent-gold mb-2">
            Join the Team
          </h1>
          <p className="text-white/60">
            Start your football journey with Kaboona FC
          </p>
        </div>

        {/* Progress Indicator */}
        <StepIndicator currentStep={currentStep} steps={this.steps} />

        {/* Form Container */}
        <motion.div
          className="w-full max-w-2xl mt-8"
          layout
        >
          <div className="bg-surface-dark rounded-2xl shadow-2xl p-6 md:p-8 border border-white/10">
            {/* Error Message */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{submitError}</p>
              </motion.div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {this.renderStep()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              {currentStep > 1 ? (
                <motion.button
                  type="button"
                  onClick={this.handleBack}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </span>
                </motion.button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <motion.button
                  type="button"
                  onClick={this.handleNext}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={this.handleSubmit}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing Payment...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Complete Registration
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Step Summary */}
          <div className="mt-4 text-center text-sm text-white/40">
            Step {currentStep} of 5 - {this.steps[currentStep - 1].label}
          </div>
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  error: state.auth?.error,
});

const mapDispatchToProps = {
  setUser,
  setSession,
  setError,
};

export default connect(mapStateToProps, mapDispatchToProps)(TrainingSignup);
