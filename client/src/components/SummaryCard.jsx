import React from 'react';

const SummaryCard = ({ summary, onCopy, onDelete, onViewFull }) => {
  const truncatedSummary = summary.summary_text?.length > 200 
    ? summary.summary_text.substring(0, 200) + '...' 
    : summary.summary_text;

  const handleCopy = () => {
    if (onCopy) onCopy(summary.summary_text);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(summary._id);
  };

  const handleViewFull = () => {
    if (onViewFull) onViewFull(summary);
  };

  return (
    <div className="glass-card-hover rounded-3xl p-6 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-3 space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold transform scale-105 ${
              summary.type === 'youtube' 
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
            }`}>
              {summary.type === 'youtube' ? '▶ YouTube' : '📄 PDF'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {new Date(summary.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 line-clamp-2">
            {summary.original_source}
          </h3>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
            {truncatedSummary}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-200 dark:border-primary-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{summary.word_count} words</span>
            </div>
            <div className="flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-secondary-500/10 to-secondary-600/10 border border-secondary-200 dark:border-secondary-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-secondary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{summary.reading_time} min read</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transform hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Copy to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          </button>
          
          <button
            onClick={handleViewFull}
            className="p-2.5 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 transform hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="View full summary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transform hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Delete summary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;