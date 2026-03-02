import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadPDF = ({ onFileSelect, disabled }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`relative overflow-hidden rounded-3xl p-8 text-center cursor-pointer transition-all duration-500 border-2 border-dashed ${
        isDragActive 
          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 scale-[1.02] shadow-xl' 
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className={`mx-auto h-20 w-20 rounded-3xl flex items-center justify-center transition-all duration-300 ${
          isDragActive 
            ? 'bg-gradient-to-br from-primary-600 to-secondary-600 scale-110 shadow-2xl' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${
            isDragActive ? 'text-white' : 'text-gray-400'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="space-y-2">
          {isDragActive ? (
            <>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400 animate-pulse">
                📥 Drop the PDF here...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Release to upload
              </p>
            </>
          ) : (
            <>
              <p className="text-lg">
                <span className="font-bold text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PDF files only (Max 10MB)
              </p>
            </>
          )}
        </div>
        {onFileSelect && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 inline-block">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              ✓ {onFileSelect.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPDF;