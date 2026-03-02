import React from 'react';
import { ClipLoader } from 'react-spinners';

const Loader = ({ loading, message = 'Processing...' }) => {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
        <ClipLoader color="#4F46E5" size={50} />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Loader;