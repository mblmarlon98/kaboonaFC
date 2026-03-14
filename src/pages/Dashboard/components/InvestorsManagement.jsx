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
import { supabase } from '../../../services/supabase';

/**
 * Investors Management Component
 * Manage campaigns, view donation history, create/edit campaigns
 * All data fetched from Supabase (campaigns, donations, profiles tables)
 */
class InvestorsManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'campaigns',
      campaigns: [],
      donations: [],
      donationTrends: [],
      backersMap: {},
      loading: true,
      saving: false,
      showCampaignModal: false,
      selectedCampaign: null,
      campaignForm: {
        title: '',
        description: '',
        goalAmount: '',
        startDate: '',
        endDate: '',
      },
    };
  }

  componentDidMount() {
    this.fetchAllData();
  }

  fetchAllData = async () => {
    this.setState({ loading: true });
    await Promise.all([
      this.fetchCampaigns(),
      this.fetchDonations(),
    ]);
    this.setState({ loading: false });
  };

  fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      this.setState({ campaigns: [] });
      return;
    }

    // Fetch backer counts per campaign from donations table
    const backersMap = {};
    if (data && data.length > 0) {
      const campaignIds = data.map((c) => c.id);
      // Get distinct user counts per campaign
      const { data: donationRows, error: donErr } = await supabase
        .from('donations')
        .select('campaign_id, user_id')
        .in('campaign_id', campaignIds);

      if (!donErr && donationRows) {
        // Count unique user_ids per campaign_id
        const seen = {};
        donationRows.forEach((row) => {
          const key = row.campaign_id;
          if (!seen[key]) seen[key] = new Set();
          seen[key].add(row.user_id);
        });
        Object.keys(seen).forEach((cid) => {
          backersMap[cid] = seen[cid].size;
        });
      }
    }

    this.setState({
      campaigns: data || [],
      backersMap,
    });
  };

  fetchDonations = async () => {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        id,
        user_id,
        amount,
        message,
        sponsor_tier,
        campaign_id,
        created_at,
        profiles:user_id ( full_name ),
        campaigns:campaign_id ( title )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
      this.setState({ donations: [], donationTrends: [] });
      return;
    }

    const donations = (data || []).map((d) => ({
      id: d.id,
      donor: d.profiles?.full_name || 'Anonymous',
      amount: Number(d.amount) || 0,
      campaign: d.campaigns?.title || 'Unknown Campaign',
      date: d.created_at ? d.created_at.split('T')[0] : '',
      anonymous: !d.profiles?.full_name,
      message: d.message,
      sponsorTier: d.sponsor_tier,
    }));

    // Compute donation trends grouped by month
    const monthTotals = {};
    (data || []).forEach((d) => {
      if (!d.created_at) return;
      const date = new Date(d.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthTotals[key] = (monthTotals[key] || 0) + (Number(d.amount) || 0);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const donationTrends = Object.keys(monthTotals)
      .sort()
      .map((key) => {
        const monthIdx = parseInt(key.split('-')[1], 10) - 1;
        const year = key.split('-')[0];
        return {
          month: `${monthNames[monthIdx]} ${year}`,
          amount: monthTotals[key],
        };
      });

    this.setState({ donations, donationTrends });
  };

  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  formatCurrency = (value) => {
    return `RM ${Number(value).toLocaleString()}`;
  };

  getProgressPercentage = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
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
          title: campaign.title || '',
          description: campaign.description || '',
          goalAmount: campaign.goal_amount || '',
          startDate: campaign.start_date || '',
          endDate: campaign.end_date || '',
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

  saveCampaign = async () => {
    const { selectedCampaign, campaignForm } = this.state;
    this.setState({ saving: true });

    const payload = {
      title: campaignForm.title,
      description: campaignForm.description,
      goal_amount: parseFloat(campaignForm.goalAmount) || 0,
      start_date: campaignForm.startDate || null,
      end_date: campaignForm.endDate || null,
    };

    if (selectedCampaign) {
      // Update existing campaign
      const { error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', selectedCampaign.id);

      if (error) {
        console.error('Error updating campaign:', error);
        this.setState({ saving: false });
        return;
      }
    } else {
      // Create new campaign
      const { error } = await supabase
        .from('campaigns')
        .insert({
          ...payload,
          current_amount: 0,
          status: 'active',
        });

      if (error) {
        console.error('Error creating campaign:', error);
        this.setState({ saving: false });
        return;
      }
    }

    this.setState({ saving: false });
    this.closeCampaignModal();
    await this.fetchCampaigns();
  };

  endCampaign = async (campaignId) => {
    const { error } = await supabase
      .from('campaigns')
      .update({ status: 'completed' })
      .eq('id', campaignId);

    if (error) {
      console.error('Error ending campaign:', error);
      return;
    }

    await this.fetchCampaigns();
  };

  deleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('Error deleting campaign:', error);
      return;
    }

    await this.fetchCampaigns();
  };

  render() {
    const {
      activeTab,
      campaigns,
      donations,
      donationTrends,
      backersMap,
      loading,
      saving,
      showCampaignModal,
      selectedCampaign,
      campaignForm,
    } = this.state;

    const activeCampaigns = campaigns.filter((c) => c.status === 'active');
    const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
    const totalRaised = campaigns.reduce((sum, c) => sum + (Number(c.current_amount) || 0), 0);
    const totalBackers = Object.values(backersMap).reduce((sum, count) => sum + count, 0);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading campaigns and donations...</p>
          </div>
        </div>
      );
    }

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
            {donationTrends.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                No donation data to display yet
              </div>
            )}
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
            {campaigns.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-white/40 text-lg">No campaigns yet</p>
                <p className="text-white/30 text-sm mt-1">Create your first campaign to get started</p>
              </div>
            ) : (
              campaigns.map((campaign) => {
                const currentAmount = Number(campaign.current_amount) || 0;
                const goalAmount = Number(campaign.goal_amount) || 0;
                const progress = this.getProgressPercentage(currentAmount, goalAmount);
                const daysRemaining = this.getDaysRemaining(campaign.end_date);
                const backers = backersMap[campaign.id] || 0;

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
                            {this.formatCurrency(currentAmount)}
                          </span>
                          <span className="text-white/50 text-sm ml-2">
                            of {this.formatCurrency(goalAmount)}
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
                          <span>{backers} backers</span>
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
              })
            )}
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
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-white/40">
                        No donations recorded yet
                      </td>
                    </tr>
                  ) : (
                    donations.map((donation) => (
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
                    ))
                  )}
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
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={this.saveCampaign}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : selectedCampaign ? 'Save Changes' : 'Create Campaign'}
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
