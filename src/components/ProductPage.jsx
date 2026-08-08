import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { playNotificationSound } from '../utils/sound';
import { speakEmployeeUpdate } from '../utils/speech';
import { getEmployeeImage } from '../utils/employeeImages';

const ProductPage = ({ data }) => {
  const [loading, setLoading] = useState(true);
  const [productImage, setProductImage] = useState('');
  const [error, setError] = useState(null);

  // Announce which employee scanned which order/style. Runs once per
  // `data` change (not on every render) so the utterance isn't cancelled
  // mid-sentence by unrelated re-renders.
  useEffect(() => {
    speakEmployeeUpdate({
      employeeName: data?.[0]?.employees?.user_name?.split(' / ')[0] || 'अज्ञात',
      styleNumber: data?.[0]?.orders_2?.style_number,
      orderId: data?.[0]?.order_id,
    });

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [data]);

  const PRODUCT_API = 'https://return-processing-api.onrender.com/product-styles';

  const fetchProductImage = useCallback(async (style_number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${PRODUCT_API}?codes=${style_number}`);
      const firstImage = response.data?.data?.[0]?.images?.[0];
      setProductImage(firstImage || '');
    } catch (error) {
      console.error('Failed to fetch product image:', error);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchProductImage((data && data[0]?.orders_2?.style_number) || 15018);
    playNotificationSound();
  }, [fetchProductImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-2 px-2 sm:py-4 sm:px-4">
      <div className="container mx-auto">
        <div className="flex gap-4 mb-6">
          <StatusIndicator loading={loading} hasData={!!productImage} error={error} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          <div className="space-y-6">
            {/* Employee Image Card */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700">
              <div className="relative group">
                <img
                  className="w-full h-[260px] sm:h-[380px] md:h-[520px] lg:h-[700px] xl:h-[900px] object-cover rounded-xl border-2 border-blue-500 transition-all duration-300"
                  src={getEmployeeImage(data[0]?.employees?.user_name)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
              </div>
            </div>
          </div>

          {/* Right Panel - Product Preview */}
          <div className="bg-gray-800 rounded-2xl p-3 sm:p-6 border border-gray-700 h-full">
            <div className="relative h-[300px] sm:h-[420px] md:h-[600px] lg:h-[800px] xl:h-[1020px] rounded-xl overflow-hidden border-2 border-gray-600">
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <ErrorMessage message={error} />
              ) : productImage ? (
                <img
                  className="w-full h-full object-contain bg-gray-900"
                  src={productImage}
                  alt="Product preview"
                  loading="lazy"
                />
              ) : (
                <ErrorMessage message="No product data available" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-white mt-4 font-medium">Loading product preview...</p>
    </div>
  </div>
);

// Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
    <div className="text-center p-4">
      <div className="text-red-500 text-4xl mb-2">⚠️</div>
      <p className="text-white font-medium">{message}</p>
    </div>
  </div>
);

// Status Indicator Component
const StatusIndicator = ({ loading, hasData, error }) => {
  if (loading) {
    return (
      <div className="flex items-center text-yellow-400">
        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-red-400">
        <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
        Error
      </div>
    );
  }

  return null;
};

export default ProductPage;
