import React, { useState } from 'react';
import { toast } from 'react-toastify';

const EnhancedSummaryDisplay = ({ summary, type, onRegenerate, loading }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!summary) return null;

  const wordCount = summary.summary_text ? summary.summary_text.split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary.summary_text);
      setCopied(true);
      toast.success('✅ Summary copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([summary.summary_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-${type}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('📥 Summary downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download summary');
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
      toast.info('🔄 Regenerating summary...');
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Split summary into sections if it's long
  const paragraphs = summary.summary_text.split('\n\n').filter(p => p.trim());
  const isLongSummary = paragraphs.length > 3;
  const displayedParagraphs = expanded ? paragraphs : paragraphs.slice(0, 3);

  const formatText = (text) => {
    // Basic bold parsing: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-gray-900 dark:text-white font-bold bg-primary-50 dark:bg-primary-900/20 px-1 rounded">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Stats */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Type Badge */}
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${type === 'youtube'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              }`}>
              {type === 'youtube' ? '▶ YouTube' : '📄 PDF'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {readingTime} min read
            </span>
          </div>

          {/* Word Count */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {wordCount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">words</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div className="glass-card-hover rounded-3xl p-8 transition-all duration-300">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            AI Summary
          </h3>

          <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
            {displayedParagraphs.map((paragraph, index) => {
              const isBullet = /^[\-\*]\s/.test(paragraph);
              const isNumbered = /^\d+\.\s/.test(paragraph);
              if (isBullet || isNumbered) {
                return (
                  <div key={index} className="flex items-start bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/10 dark:to-transparent p-4 rounded-xl border-l-4 border-primary-500 shadow-sm transition-all hover:shadow-md">
                    <div className="mr-3 text-primary-500 mt-0.5">
                      {isBullet ? (
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
                      ) : (
                        <span className="font-bold text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full">{paragraph.match(/^\d+/)?.[0]}</span>
                      )}
                    </div>
                    <p className="flex-1 transition-colors hover:text-gray-900 dark:hover:text-white">
                      {formatText(paragraph.replace(/^[\-\*]\s|^\d+\.\s/, ''))}
                    </p>
                  </div>
                );
              }
              return (
                <p key={index} className="transition-colors hover:text-gray-900 dark:hover:text-white text-lg">
                  {formatText(paragraph)}
                </p>
              );
            })}
          </div>

          {/* Expand/Collapse Button */}
          {isLongSummary && (
            <button
              onClick={toggleExpand}
              className="mt-4 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center"
            >
              {expanded ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Show Less
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Show More
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={loading}
          className={`relative overflow-hidden group px-6 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-[1.02] ${copied
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg'
            }`}
        >
          <span className="flex items-center justify-center space-x-2">
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </span>
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={loading}
          className="px-6 py-4 rounded-2xl font-bold bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Download TXT</span>
        </button>

        {/* Regenerate Button */}
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className={`px-6 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-[1.02] ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 text-white shadow-lg hover:shadow-xl'
            }`}
        >
          <span className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Regenerate</span>
          </span>
        </button>
      </div>

      {/* Source Information */}
      {summary.original_source && (
        <div className="glass-card rounded-3xl p-6">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Source
          </h4>
          <div className="flex items-start space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zM2 10a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
            </svg>
            <a
              href={summary.original_source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all line-clamp-2"
            >
              {summary.original_source}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSummaryDisplay;
