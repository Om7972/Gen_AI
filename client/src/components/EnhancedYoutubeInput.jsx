import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const EnhancedYoutubeInput = ({ onSummarize, loading }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [videoInfo, setVideoInfo] = useState(null);
  const [extractingInfo, setExtractingInfo] = useState(false);

  // Extract YouTube video ID from URL
  const getVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/
    ];
    
    for (let pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Fetch video info when URL changes
  useEffect(() => {
    const fetchVideoInfo = async () => {
      const videoId = getVideoId(youtubeUrl);
      if (videoId && youtubeUrl !== videoInfo?.url) {
        setExtractingInfo(true);
        try {
          // Using oEmbed API to get video info
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (response.ok) {
            const data = await response.json();
            setVideoInfo({
              id: videoId,
              title: data.title,
              thumbnail: data.thumbnail_url.replace('default', 'hqdefault'),
              author: data.author_name,
              url: youtubeUrl
            });
          }
        } catch (error) {
          console.error('Error fetching video info:', error);
        } finally {
          setExtractingInfo(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchVideoInfo, 800);
    return () => clearTimeout(debounceTimer);
  }, [youtubeUrl]);

  const handleSubmit = () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    const videoId = getVideoId(youtubeUrl);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return;
    }

    onSummarize({ 
      video_link: youtubeUrl, 
      summary_length: summaryLength,
      video_info: videoInfo 
    });
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <label htmlFor="youtube-url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            <span>YouTube Video URL</span>
          </span>
        </label>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 10-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="youtube-url"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={loading}
            className="input-modern pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Video Preview */}
      {extractingInfo && (
        <div className="glass-card rounded-3xl p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-32 h-20 skeleton rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 skeleton rounded-lg w-3/4"></div>
              <div className="h-3 skeleton rounded-lg w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {videoInfo && !extractingInfo && (
        <div className="glass-card-hover rounded-3xl p-6 transition-all duration-300 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Thumbnail */}
            <div className="relative group flex-shrink-0">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-full sm:w-48 h-32 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
                {videoInfo.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {videoInfo.author}
              </p>
              <div className="mt-3 flex items-center space-x-3">
                <span className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                  ▶ YouTube Video
                </span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
                  HD Quality
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Length Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span>Summary Length</span>
          </span>
        </label>
        
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'short', label: 'Short', desc: '~100 words' },
            { value: 'medium', label: 'Medium', desc: '~250 words' },
            { value: 'detailed', label: 'Detailed', desc: '~500 words' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSummaryLength(option.value)}
              disabled={loading}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                summaryLength === option.value
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-center space-y-1">
                <div className={`font-bold ${
                  summaryLength === option.value 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {option.desc}
                </div>
              </div>
              {summaryLength === option.value && (
                <div className="absolute top-2 right-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !youtubeUrl.trim()}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg transform transition-all duration-300 ${
          loading || !youtubeUrl.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Generate Summary</span>
          </span>
        )}
      </button>
    </div>
  );
};

export default EnhancedYoutubeInput;
