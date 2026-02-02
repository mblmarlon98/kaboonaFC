import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Step indicator component showing progress through the multi-step form
 */
class StepIndicator extends Component {
  render() {
    const { currentStep, steps } = this.props;

    return (
      <div className="w-full max-w-3xl mx-auto mb-8">
        {/* Steps Container */}
        <div className="flex items-center justify-between relative">
          {/* Progress Line Background */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -translate-y-1/2 z-0" />

          {/* Progress Line Fill */}
          <motion.div
            className="absolute left-0 top-1/2 h-0.5 bg-accent-gold -translate-y-1/2 z-0"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />

          {/* Step Circles */}
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <div key={stepNumber} className="relative z-10 flex flex-col items-center">
                {/* Circle */}
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-accent-gold border-accent-gold'
                      : isCurrent
                      ? 'bg-surface-dark border-accent-gold'
                      : 'bg-surface-dark border-white/20'
                  }`}
                  initial={{ scale: 1 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`text-sm font-bold ${
                        isCurrent ? 'text-accent-gold' : 'text-white/40'
                      }`}
                    >
                      {stepNumber}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap ${
                    isCompleted || isCurrent ? 'text-accent-gold' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default StepIndicator;
