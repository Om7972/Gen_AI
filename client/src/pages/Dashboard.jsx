import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { summaryAPI } from '../services/api';
import UploadPDF from '../components/UploadPDF';
import YoutubeInput from '../components/YoutubeInput';
import SummaryCard from '../components/SummaryCard';
import { SkeletonSummary } from '../components/Skeleton';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [summaryLength, setSummaryLength] = useState('medium');
  const [recentSummaries, setRecentSummaries] = useState([]);
  const [expandedSection, setExpandedSection] = useState(true);

  const navigate = useNavigate();

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url && url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Fetch video info when URL changes
  useEffect(() => {
    const videoId = getYouTubeVideoId(youtubeUrl);
    if (videoId) {
      // Mock video info - in production, you'd fetch from YouTube API
      setVideoInfo({
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        title: 'Video Preview',
        duration: 'Loading...'
      });
    } else {
      setVideoInfo(null);
    }
  }, [youtubeUrl]);

  const handleSummarizeYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await summaryAPI.summarizeYouTube({ video_link: youtubeUrl });
      setProgress(100);
      setSummaryResult(response.data);
      toast.success('✨ Summary generated successfully!');
      
      setRecentSummaries(prev => [response.data, ...prev.slice(0, 2)]);
    } catch (error) {
      console.error('Error generating YouTube summary:', error);
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleSummarizePDF = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file');
      return;
    }

    // Validate file size (10MB max)
    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', pdfFile);

    setLoading(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await summaryAPI.summarizePDF(formData);
      setProgress(100);
      setSummaryResult(response.data);
      toast.success('✨ Summary generated successfully!');
      
      setRecentSummaries(prev => [response.data, ...prev.slice(0, 2)]);
    } catch (error) {
      console.error('Error generating PDF summary:', error);
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleCopySummary = (summaryText) => {
    navigator.clipboard.writeText(summaryText);
    toast.success('📋 Summary copied to clipboard!');
  };

  const handleDownloadSummary = (summaryText) => {
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Summary downloaded!');
  };

  const handleRegenerate = () => {
    setSummaryResult(null);
    if (activeTab === 'youtube') {
      handleSummarizeYouTube();
    } else {
      handleSummarizePDF();
    }
  };

  const handleFileSelect = (file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setPdfFile(file);
    toast.success(`✓ ${file.name} selected`);
  };

  const handleUrlChange = (url) => {
    setYoutubeUrl(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'youtube') {
      handleSummarizeYouTube();
    } else {
      handleSummarizePDF();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold heading-gradient mb-4">
            SummarizeAI Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transform lengthy documents and videos into concise, AI-powered summaries in seconds
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-10">
          <div className="glass-card rounded-2xl p-2 inline-flex mx-auto">
            <button
              onClick={() => setActiveTab('youtube')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'youtube'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <span>YouTube</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'pdf'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span>PDF</span>
              </span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-8 gradient-border">
              <form onSubmit={handleSubmit}>
                {activeTab === 'youtube' ? (
                  <div className="space-y-6">
                    <YoutubeInput 
                      value={youtubeUrl}
                      onUrlChange={handleUrlChange}
                      disabled={loading}
                    />
                    
                    {/* Video Preview */}
                    {videoInfo && (
                      <div className="glass-card rounded-2xl p-4 animate-fade-in">
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-900">
                          <img 
                            src={videoInfo.thumbnail} 
                            alt="Video thumbnail" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/640x360?text=Video+Preview';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                            <div className="flex items-center space-x-2 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                              <span className="text-sm font-medium">{videoInfo.title}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Length Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Summary Length
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['short', 'medium', 'detailed'].map((length) => (
                          <button
                            key={length}
                            type="button"
                            onClick={() => setSummaryLength(length)}
                            className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              summaryLength === length
                                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                                : 'border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'
                            }`}
                          >
                            {length.charAt(0).toUpperCase() + length.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {loading && progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Processing...</span>
                          <span className="font-semibold text-primary-600">{progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center animate-pulse">
                          Analyzing content and extracting key insights...
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !youtubeUrl.trim()}
                      className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold py-4"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating Summary...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Summary
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <UploadPDF 
                      onFileSelect={handleFileSelect}
                      disabled={loading}
                    />
                    
                    {/* File Preview */}
                    {pdfFile && (
                      <div className="glass-card rounded-2xl p-6 animate-fade-in">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {pdfFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(pdfFile.size)} • PDF Document
                            </p>
                          </div>
                          <button
                            onClick={() => setPdfFile(null)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {loading && progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Extracting text...</span>
                          <span className="font-semibold text-primary-600">{progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center animate-pulse">
                          Processing document and identifying key sections...
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !pdfFile}
                      className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold py-4"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating Summary...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate Summary
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Recent Summaries */}
            {recentSummaries.length > 0 && (
              <div className="animate-slide-up">
                <h2 className="text-2xl font-bold mb-4">Recent Summaries</h2>
                {recentSummaries.map((summary, index) => (
                  <SummaryCard
                    key={index}
                    summary={{
                      summary_text: summary.summary,
                      type: activeTab,
                      original_source: activeTab === 'youtube' ? youtubeUrl : pdfFile?.name,
                      created_at: new Date().toISOString(),
                      word_count: summary.word_count || 0,
                      reading_time: summary.reading_time || 0,
                      _id: `recent-${index}`
                    }}
                    onCopy={handleCopySummary}
                    onDelete={() => {}}
                    onViewFull={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div>
            <div className="glass-card rounded-3xl p-8 sticky top-6 min-h-[600px]">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summary Result
              </h2>
              
              {loading ? (
                <SkeletonSummary />
              ) : summaryResult ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleRegenerate}
                      className="px-4 py-2 rounded-xl btn-outline flex items-center space-x-2 text-sm font-semibold"
                      title="Regenerate summary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-6 border border-primary-200 dark:border-primary-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold heading-gradient mb-1">
                          {summaryResult.word_count || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold heading-gradient mb-1">
                          {summaryResult.reading_time || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Min Read</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold heading-gradient mb-1">
                          {Math.ceil((summaryResult.word_count || 0) / 200)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Sentences</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold heading-gradient mb-1">
                          {summaryLength.charAt(0).toUpperCase() + summaryLength.slice(1)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Length</div>
                      </div>
                    </div>

                    {/* Collapsible Summary Content */}
                    <div className="border-t border-primary-200 dark:border-primary-700 pt-4">
                      <button
                        onClick={() => setExpandedSection(!expandedSection)}
                        className="w-full flex items-center justify-between mb-3 px-2 py-1 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          Summary
                        </h3>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 text-gray-500 transform transition-transform duration-300 ${expandedSection ? 'rotate-180' : ''}`}
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {expandedSection && (
                        <div className="prose dark:prose-invert max-w-none animate-slide-up">
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {summaryResult.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons - Copy & Download */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleCopySummary(summaryResult.summary)}
                      className="btn-outline flex items-center justify-center space-x-2 py-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      <span className="font-semibold">Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownloadSummary(summaryResult.summary)}
                      className="btn-gradient flex items-center justify-center space-x-2 py-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M5 29a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Your summary will appear here
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Enter a YouTube URL or upload a PDF to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
