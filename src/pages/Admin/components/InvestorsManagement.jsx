import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock campaigns data
const mockCampaigns = [
  {
    id: 1,
    title: 'New Team Jerseys for 2024 Season',
    description: 'Help us get professional-grade jerseys for the upcoming tournament season.',
    goalAmount: 8000,
    currentAmount: 5600,
    backers: 47,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    status: 'active',
    category: 'Equipment',
  },
  {
    id: 2,
    title: 'Training Equipment Upgrade',
    description: 'We need new training cones, balls, goal posts, and agility equipment.',
    goalAmount: 5000,
    currentAmount: 2100,
    backers: 23,
    startDate: '2024-02-01',
    endDate: '2024-04-01',
    status: 'active',
    category: 'Training',
  },
  {
    id: 3,
    title: 'Away Tournament Fund',
    description: 'Support our team travel expenses for the Inter-University Championship.',
    goalAmount: 12000,
    currentAmount: 9800,
    backers: 89,
    startDate: '2024-01-01',
    endDate: '2024-02-28',
    status: 'active',
    category: 'Travel',
  },
  {
    id: 4,
    title: 'Youth Development Program',
    description: 'Fund coaching clinics and youth player development initiatives.',
    goalAmount: 6000,
    currentAmount: 6000,
    backers: 52,
    startDate: '2023-10-01',
    endDate: '2024-01-31',
    status: 'completed',
    category: 'Development',
  },
];

// Mock donation history
const mockDonations = [
  { id: 1, donor: 'Ahmad Rahman', amount: 500, campaign: 'Away Tournament Fund', date: '2024-02-15', anonymous: false },
  { id: 2, donor: 'Anonymous', amount: 250, campaign: 'New Team Jerseys', date: '2024-02-15', anonymous: true },
  { id: 3, donor: 'Sarah Lee', amount: 100, campaign: 'Training Equipment', date: '2024-02-14', anonymous: false },
  { id: 4, donor: 'Corporate Sponsor A', amount: 2000, campaign: 'Away Tournament Fund', date: '2024-02-13', anonymous: false },
  { id: 5, donor: 'Wei Chen', amount: 150, campaign: 'New Team Jerseys', date: '2024-02-12', anonymous: false },
  { id: 6, donor: 'Anonymous', amount: 1000, campaign: 'Training Equipment', date: '2024-02-11', anonymous: true },
];

// Mock donation trends
const donationTrends = [
  { month: 'Jan', amount: 8500 },
  { month: 'Feb', amount: 12000 },
  { month: 'Mar', amount: 9500 },
  { month: 'Apr', amount: 15000 },
  { month: 'May', amount: 11000 },
  { month: 'Jun', amount: 18000 },
  { month: 'Jul', amount: 22000 },
];

/**
 * Investors Management Component
 * Manage campaigns, view donation history, create/edit campaigns
 */
class InvestorsManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'campaigns',
      campaigns: mockCampaigns,
      donations: mockDonations,
      showCampaignModal: false,
      selectedCampaign: null,
      campaignForm: {
        title: '',
        description: '',
        goalAmount: '',
        category: 'Equipment',
        startDate: '',
        endDate: '',
      },
    };
  }

  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  formatCurrency = (value) => {
    return `RM ${value.toLocaleString()}`;
  };

  getProgressPercentage = (current, goal) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  openCampaignModal = (campaign = null) => {
    if (campaign) {
      this.setState({
        showCampaignModal: true,
        selectedCampaign: campaign,
        campaignForm: {
          title: campaign.title,
          description: campaign.description,
          goalAmount: campaign.goalAmount,
          category: campaign.category,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
      });
    } else {
      this.setState({
        showCampaignModal: true,
        selectedCampaign: null,
        campaignForm: {
          title: '',
          description: '',
          goalAmount: '',
          category: 'Equipment',
          startDate: '',
          endDate: '',
        },
      });
    }
  };

  closeCampaignModal = () => {
    this.setState({ showCampaignModal: false, selectedCampaign: null });
  };

  handleFormChange = (field, value) => {
    this.setState((prevState) => ({
      campaignForm: { ...prevState.campaignForm, [field]: value },
    }));
  };

  saveCampaign = () => {
    const { campaigns, selectedCampaign, campaignForm } = this.state;

    if (selectedCampaign) {
      // Update existing campaign
      const updatedCampaigns = campaigns.map((c) =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              ...campaignForm,
              goalAmount: parseInt(campaignForm.goalAmount),
            }
          : c
      );
      this.setState({ campaigns: updatedCampaigns });
    } else {
      // Add new campaign
      const newCampaign = {
        id: campaigns.length + 1,
        ...campaignForm,
        goalAmount: parseInt(campaignForm.goalAmount),
        currentAmount: 0,
        backers: 0,
        status: 'active',
      };
      this.setState({ campaigns: [...campaigns, newCampaign] });
    }

    this.closeCampaignModal();
  };

  endCampaign = (campaignId) => {
    this.setState((prevState) => ({
      campaigns: prevState.campaigns.map((c) =>
        c.id === campaignId ? { ...c, status: 'completed' } : c
      ),
    }));
  };

  deleteCampaign = (campaignId) => {
    this.setState((prevState) => ({
      campaigns: prevState.campaigns.filter((c) => c.id !== campaignId),
    }));
  };

  render() {
    const { activeTab, campaigns, donations, showCampaignModal, selectedCampaign, campaignForm } = this.state;

    const activeCampaigns = campaigns.filter((c) => c.status === 'active');
    const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
    const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0);
    const totalBackers = campaigns.reduce((sum, c) => sum + c.backers, 0);

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Investors & Campaigns</h1>
            <p className="text-white/50 mt-1">Manage crowdfunding campaigns and track donations</p>
          </div>
          <button
            onClick={() => this.openCampaignModal()}
            className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Campaign
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Total Raised (All Time)</p>
            <h3 className="text-2xl font-display font-bold text-accent-gold mt-2">
              {this.formatCurrency(totalRaised)}
            </h3>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Active Campaigns</p>
            <h3 className="text-2xl font-display font-bold text-white mt-2">
              {activeCampaigns.length}
            </h3>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Total Backers</p>
            <h3 className="text-2xl font-display font-bold text-secondary-blue mt-2">
              {totalBackers}
            </h3>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Completed Campaigns</p>
            <h3 className="text-2xl font-display font-bold text-green-400 mt-2">
              {completedCampaigns.length}
            </h3>
          </div>
        </motion.div>

        {/* Donation Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-display font-bold text-white mb-4">Donation Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(v) => `RM ${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`RM ${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2"
        >
          <button
            onClick={() => this.handleTabChange('campaigns')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => this.handleTabChange('donations')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'donations'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Donation History
          </button>
        </motion.div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {campaigns.map((campaign) => {
              const progress = this.getProgressPercentage(campaign.currentAmount, campaign.goalAmount);
              const daysRemaining = this.getDaysRemaining(campaign.endDate);

              return (
                <div
                  key={campaign.id}
                  className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Campaign Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-400/20 text-green-400'
                              : 'bg-white/10 text-white/50'
                          }`}>
                            {campaign.status}
                          </span>
                          <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded-full text-xs font-medium">
                            {campaign.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-display font-bold text-white">{campaign.title}</h3>
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">{campaign.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => this.openCampaignModal(campaign)}
                          className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => this.endCampaign(campaign.id)}
                            className="p-2 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition-colors"
                            title="End Campaign"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => this.deleteCampaign(campaign.id)}
                          className="p-2 bg-red-400/20 text-red-400 rounded-lg hover:bg-red-400/30 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Progress */}
                  <div className="p-6">
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <span className="text-2xl font-display font-bold text-accent-gold">
                          {this.formatCurrency(campaign.currentAmount)}
                        </span>
                        <span className="text-white/50 text-sm ml-2">
                          of {this.formatCurrency(campaign.goalAmount)}
                        </span>
                      </div>
                      <span className="text-white font-bold">{progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100 ? 'bg-green-400' : 'bg-accent-gold'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <div className="flex items-center gap-1 text-white/60">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{campaign.backers} backers</span>
                      </div>
                      {campaign.status === 'active' && (
                        <div className="flex items-center gap-1 text-white/60">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{daysRemaining} days left</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Donor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {donations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            donation.anonymous ? 'bg-white/10' : 'bg-accent-gold/20'
                          }`}>
                            {donation.anonymous ? (
                              <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            ) : (
                              <span className="text-accent-gold font-bold">
                                {donation.donor.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {donation.anonymous ? 'Anonymous' : donation.donor}
                            </p>
                            {donation.anonymous && (
                              <p className="text-white/50 text-xs">Hidden donor</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/70">{donation.campaign}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-accent-gold font-bold">
                          {this.formatCurrency(donation.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/70">{donation.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-white/50 text-sm">
                Showing {donations.length} donations
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                  Previous
                </button>
                <button className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Campaign Modal */}
        {showCampaignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={this.closeCampaignModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-dark-elevated rounded-xl p-6 max-w-lg w-full border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold text-white mb-6">
                {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Campaign Title</label>
                  <input
                    type="text"
                    value={campaignForm.title}
                    onChange={(e) => this.handleFormChange('title', e.target.value)}
                    placeholder="e.g., New Team Jerseys"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Description</label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => this.handleFormChange('description', e.target.value)}
                    rows={3}
                    placeholder="Describe the campaign and how the funds will be used..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Goal Amount (RM)</label>
                  <input
                    type="number"
                    value={campaignForm.goalAmount}
                    onChange={(e) => this.handleFormChange('goalAmount', e.target.value)}
                    placeholder="5000"
                    min="100"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Category</label>
                  <select
                    value={campaignForm.category}
                    onChange={(e) => this.handleFormChange('category', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Training">Training</option>
                    <option value="Travel">Travel</option>
                    <option value="Development">Development</option>
                    <option value="Events">Events</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Start Date</label>
                    <input
                      type="date"
                      value={campaignForm.startDate}
                      onChange={(e) => this.handleFormChange('startDate', e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">End Date</label>
                    <input
                      type="date"
                      value={campaignForm.endDate}
                      onChange={(e) => this.handleFormChange('endDate', e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.closeCampaignModal}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={this.saveCampaign}
                  className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
                >
                  {selectedCampaign ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }
}

export default InvestorsManagement;
