import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { summaryAPI, authAPI } from '../services/api';
import EnhancedYoutubeInput from '../components/EnhancedYoutubeInput';
import EnhancedPDFInput from '../components/EnhancedPDFInput';
import EnhancedSummaryDisplay from '../components/EnhancedSummaryDisplay';
import { SkeletonCard } from '../components/Skeleton';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const DashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('youtube');
  
  // Summary state
  const [summaryResult, setSummaryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // User stats state
  const [userStats, setUserStats] = useState({
    totalSummaries: 0,
    youtubeCount: 0,
    pdfCount: 0,
    summariesToday: 0,
    dailyLimit: 5,
    averageWords: 0,
    timeSaved: 0,
    isPremium: false
  });
  
  // History state
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch user profile and history on mount
  useEffect(() => {
    fetchUserProfile();
    fetchHistory();
  }, []);

  // Filter history when filter or search changes
  useEffect(() => {
    filterHistory();
  }, [historyFilter, historySearch, history]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      
      setUserStats(prev => ({
        ...prev,
        summariesToday: userData.summaries_count_today || 0,
        dailyLimit: userData.daily_limit || 5,
        isPremium: userData.is_premium || false
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await summaryAPI.getHistory();
      const summaries = response.data.summaries || [];
      
      setHistory(summaries);
      
      // Calculate analytics
      const youtubeSummaries = summaries.filter(s => s.type === 'youtube').length;
      const pdfSummaries = summaries.filter(s => s.type === 'pdf').length;
      const totalWords = summaries.reduce((acc, s) => acc + (s.word_count || 0), 0);
      const avgWords = summaries.length > 0 ? Math.round(totalWords / summaries.length) : 0;
      const timeSaved = Math.round(totalWords / 200);
      
      setUserStats(prev => ({
        ...prev,
        totalSummaries: summaries.length,
        youtubeCount: youtubeSummaries,
        pdfCount: pdfSummaries,
        averageWords: avgWords,
        timeSaved: timeSaved
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];
    
    if (historyFilter !== 'all') {
      filtered = filtered.filter(summary => summary.type === historyFilter);
    }
    
    if (historySearch) {
      const searchLower = historySearch.toLowerCase();
      filtered = filtered.filter(summary =>
        summary.original_source?.toLowerCase().includes(searchLower) ||
        summary.summary_text?.toLowerCase().includes(searchLower)
      );
    }
    
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredHistory(filtered);
  };

  const handleDeleteSummary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this summary?')) return;
    
    try {
      await summaryAPI.deleteSummary(id);
      toast.success('Summary deleted successfully!');
      
      const updatedHistory = history.filter(s => s._id !== id && s.id !== id);
      setHistory(updatedHistory);
    } catch (error) {
      toast.error('Failed to delete summary');
    }
  };

  const handleViewSummary = (summary) => {
    setSelectedSummary(summary);
    setShowModal(true);
  };

  const handleSummarizeYouTube = async (data) => {
    setLoading(true);
    
    try {
      const response = await summaryAPI.summarizeYouTube({ video_link: data.video_link });
      setSummaryResult(response.data);
      toast.success('✨ Summary generated successfully!');
      fetchHistory(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizePDF = async (data) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', data.pdf_file);
    
    try {
      const response = await summaryAPI.summarizePDF(formData);
      setSummaryResult(response.data);
      toast.success('✨ Summary generated successfully!');
      fetchHistory(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  // Calculate remaining summaries
  const remainingSummaries = Math.max(0, userStats.dailyLimit - userStats.summariesToday);
  const usagePercentage = (userStats.summariesToday / userStats.dailyLimit) * 100;
  const isLimitReached = remainingSummaries === 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header with Usage Stats */}
        <div className="glass-card rounded-3xl p-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold heading-gradient mb-2">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You've generated <span className="font-bold text-primary-600">{userStats.totalSummaries}</span> summaries so far
              </p>
            </div>
            
            <div className="flex items-center space-x-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 px-6 py-4 rounded-2xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{userStats.summariesToday}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Today</div>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{remainingSummaries}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
            </div>
          </div>

          {/* Usage Progress Bar */}
          {!userStats.isPremium && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Daily Free Usage ({userStats.summariesToday}/{userStats.dailyLimit})
                </span>
                <span className="font-semibold text-primary-600">{Math.round(usagePercentage)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    usagePercentage > 80
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-primary-600 to-secondary-600'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              {isLimitReached && (
                <div className="mt-3 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl border-2 border-primary-200 dark:border-primary-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 18a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm5.707-7.293a1 1 0 00-1.414 1.414L9 13.828l-1.707 1.707a1 1 0 001.414 1.414l2.414-2.414a1 1 0 000-1.414L9.414 11.343 11.121 9.636a1 1 0 00-1.414-1.414L8 9.929 5.707 7.636z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-gray-900 dark:text-white">Daily limit reached!</span>
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      Upgrade to Premium
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Upgrade to premium for unlimited summaries, faster processing, and priority support
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card-hover rounded-3xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
              {userStats.totalSummaries}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Summaries</div>
          </div>

          <div className="glass-card-hover rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-1">
              {userStats.youtubeCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">YouTube Videos</div>
          </div>

          <div className="glass-card-hover rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              {userStats.pdfCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">PDF Documents</div>
          </div>

          <div className="glass-card-hover rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
              {userStats.timeSaved} min
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Time Saved</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-8 gradient-border">
              {/* Tabs */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab('youtube')}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'youtube'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span>YouTube</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'pdf'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span>PDF</span>
                  </span>
                </button>
              </div>

              {activeTab === 'youtube' ? (
                <EnhancedYoutubeInput 
                  onSummarize={handleSummarizeYouTube}
                  loading={loading}
                />
              ) : (
                <EnhancedPDFInput 
                  onSummarize={handleSummarizePDF}
                  loading={loading}
                />
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : summaryResult ? (
              <EnhancedSummaryDisplay
                summary={summaryResult}
                type={summaryResult.type}
                onRegenerate={() => {
                  setSummaryResult(null);
                  toast.info('🔄 Ready to regenerate...');
                }}
                loading={loading}
              />
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                  No Summary Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Enter a YouTube URL or upload a PDF file to generate your first AI-powered summary
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="glass-card rounded-3xl p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Summary History
            </h2>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search summaries..."
                  className="pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 outline-none"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Type Filter */}
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="youtube">YouTube</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Words</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center">
                      <div className="flex justify-center space-x-2">
                        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No summaries found
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((summary, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          summary.type === 'youtube'
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        }`}>
                          {summary.type === 'youtube' ? '▶ YouTube' : '📄 PDF'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate text-sm text-gray-900 dark:text-white" title={summary.original_source}>
                          {summary.original_source?.substring(0, 50) || 'Unknown'}...
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {summary.word_count || 0} words
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(summary.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewSummary(summary)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSummary(summary._id || summary.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* View Summary Modal */}
      {showModal && selectedSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Summary Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <EnhancedSummaryDisplay
                summary={selectedSummary}
                type={selectedSummary.type}
                loading={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardEnhanced;
