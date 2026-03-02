import React, { useState, useEffect } from 'react';
import { summaryAPI } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import { SkeletonCard } from '../components/Skeleton';
import { toast } from 'react-toastify';

const History = () => {
  const [summaries, setSummaries] = useState([]);
  const [filteredSummaries, setFilteredSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSummaries();
  }, []);

  useEffect(() => {
    let filtered = summaries;

    if (filter !== 'all') {
      filtered = filtered.filter(summary => summary.type === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(summary =>
        summary.original_source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.summary_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSummaries(filtered);
  }, [filter, searchTerm, summaries]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await summaryAPI.getHistory();
      setSummaries(response.data.summaries);
      setFilteredSummaries(response.data.summaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast.error('Failed to fetch summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSummary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      await summaryAPI.deleteSummary(id);
      setSummaries(prev => prev.filter(summary => summary._id !== id));
      toast.success('🗑️ Summary deleted successfully');
    } catch (error) {
      console.error('Error deleting summary:', error);
      toast.error('Failed to delete summary');
    }
  };

  const handleCopySummary = (summaryText) => {
    navigator.clipboard.writeText(summaryText);
    toast.success('📋 Summary copied to clipboard!');
  };

  const handleViewFull = (summary) => {
    alert(`Full Summary:\n\n${summary.summary_text}`);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 mb-6 shadow-2xl transform hover:scale-110 transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold heading-gradient mb-4">
            Summary History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your past summaries organized in one place
          </p>
        </div>

        {/* Filters and Search */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-full sm:w-48">
                <label htmlFor="filter" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Type
                </label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input-modern cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="youtube">YouTube</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search summaries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-modern pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-200 dark:border-primary-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {filteredSummaries.length} / {summaries.length}
              </span>
            </div>
          </div>
        </div>

        {/* Summaries List */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No summaries found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {summaries.length === 0
                  ? "You haven't generated any summaries yet. Start by creating your first summary!"
                  : "No summaries match your current filters. Try adjusting your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
              {filteredSummaries.map((summary) => (
                <SummaryCard
                  key={summary._id}
                  summary={summary}
                  onCopy={handleCopySummary}
                  onDelete={handleDeleteSummary}
                  onViewFull={handleViewFull}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
