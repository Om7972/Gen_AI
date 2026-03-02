import React, { useState } from 'react';

const YoutubeInput = ({ onUrlChange, disabled, value }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [error, setError] = useState('');

  const isValidYouTubeUrl = (url) => {
    const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return regExp.test(url);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue && !isValidYouTubeUrl(newValue)) {
      setError('Please enter a valid YouTube URL');
    } else {
      setError('');
    }
    
    onUrlChange(newValue);
  };

  return (
    <div className="space-y-3">
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
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14 0v8.82l-6.29-3.77a1 1 0 00-1.02 0L2 14.82V6h12z" />
          </svg>
        </div>
        <input
          type="text"
          id="youtube-url"
          value={inputValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="https://www.youtube.com/watch?v=..."
          className={`input-modern pl-12 pr-12 ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
              : 'focus:border-primary-500'
          } ${
            disabled ? 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {inputValue && !error && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default YoutubeInput;