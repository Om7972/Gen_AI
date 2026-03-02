import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

const EnhancedPDFInput = ({ onSummarize, loading }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [summaryLength, setSummaryLength] = useState('medium');

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 10MB (${formatFileSize(file.size)})`);
      return false;
    }

    return true;
  };

  const onFileDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error(rejectedFiles[0].errors[0].message);
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      toast.success(`📄 ${selectedFile.name} uploaded successfully!`);
      
      // Simulate progress for file preparation
      simulateProgress();
    }
  }, []);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: onFileDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: loading
  });

  const handleSummarize = () => {
    if (!file) {
      toast.error('Please select a PDF file first');
      return;
    }

    setProgress(100);
    onSummarize({ 
      pdf_file: file,
      summary_length: summaryLength
    });
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    toast.info('File removed');
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-3xl p-8 text-center cursor-pointer transition-all duration-500 border-2 border-dashed ${
          isDragActive && !isDragReject
            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 scale-[1.02] shadow-xl'
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={loading} />
        
        <div className="space-y-4">
          {/* Icon */}
          <div className={`mx-auto h-20 w-20 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            isDragActive
              ? 'bg-gradient-to-br from-primary-600 to-secondary-600 scale-110 shadow-2xl rotate-12'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
          }`}>
            {isDragReject ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 transition-colors ${
                isDragActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className={`text-lg font-semibold transition-colors ${
              isDragActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {isDragActive ? (isDragReject ? '❌ Invalid File Type' : '✨ Drop PDF Here') : (
                <span>
                  <span className="text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PDF files only (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* File Preview */}
      {file && (
        <div className="glass-card-hover rounded-3xl p-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* File Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">
                  {file.name}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    {formatFileSize(file.size)}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    PDF Document
                  </span>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Preparing...</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-600 to-secondary-600 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remove Button */}
            {!loading && (
              <button
                onClick={removeFile}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
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

      {/* Summarize Button */}
      <button
        onClick={handleSummarize}
        disabled={loading || !file}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg transform transition-all duration-300 ${
          loading || !file
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
            <span>Processing PDF...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Summarize PDF</span>
          </span>
        )}
      </button>
    </div>
  );
};

export default EnhancedPDFInput;
