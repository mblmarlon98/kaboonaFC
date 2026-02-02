import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Step 2: Personal Information
 */
class PersonalInfoStep extends Component {
  render() {
    const { data, onChange, errors } = this.props;

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
            Personal Information
          </h2>
          <p className="text-white/60">
            Tell us about yourself
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={data.fullName}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.fullName ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Enter your full name"
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={data.phone}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.phone ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="+60 12-345 6789"
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={data.dateOfBirth}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.dateOfBirth ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-3">
              Gender
            </label>
            <div className="flex gap-4">
              {['Male', 'Female', 'Other'].map((gender) => (
                <label
                  key={gender}
                  className={`flex items-center justify-center px-6 py-3 rounded-lg border cursor-pointer transition-colors ${
                    data.gender === gender.toLowerCase()
                      ? 'bg-accent-gold/10 border-accent-gold text-accent-gold'
                      : 'bg-background-dark border-white/20 text-white/60 hover:border-white/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={gender.toLowerCase()}
                    checked={data.gender === gender.toLowerCase()}
                    onChange={onChange}
                    className="sr-only"
                  />
                  {gender}
                </label>
              ))}
            </div>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-400">{errors.gender}</p>
            )}
          </div>

          {/* Emergency Contact Section */}
          <div className="md:col-span-2 pt-4">
            <h3 className="text-lg font-display font-semibold text-accent-gold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Emergency Contact
            </h3>
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label
              htmlFor="emergencyContactName"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Contact Name
            </label>
            <input
              type="text"
              id="emergencyContactName"
              name="emergencyContactName"
              value={data.emergencyContactName}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.emergencyContactName ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Emergency contact name"
            />
            {errors.emergencyContactName && (
              <p className="mt-1 text-sm text-red-400">{errors.emergencyContactName}</p>
            )}
          </div>

          {/* Emergency Contact Phone */}
          <div>
            <label
              htmlFor="emergencyContactPhone"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Contact Phone
            </label>
            <input
              type="tel"
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              value={data.emergencyContactPhone}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.emergencyContactPhone ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="+60 12-345 6789"
            />
            {errors.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-400">{errors.emergencyContactPhone}</p>
            )}
          </div>

          {/* Emergency Contact Relationship */}
          <div className="md:col-span-2">
            <label
              htmlFor="emergencyContactRelation"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Relationship
            </label>
            <select
              id="emergencyContactRelation"
              name="emergencyContactRelation"
              value={data.emergencyContactRelation}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.emergencyContactRelation ? 'border-red-500' : 'border-white/20'
              }`}
            >
              <option value="">Select relationship</option>
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
            {errors.emergencyContactRelation && (
              <p className="mt-1 text-sm text-red-400">{errors.emergencyContactRelation}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
}

export default PersonalInfoStep;
