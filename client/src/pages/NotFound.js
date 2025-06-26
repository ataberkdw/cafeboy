import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mx-auto h-24 w-24 bg-primary-500 rounded-full flex items-center justify-center mb-6">
          <Coffee className="h-12 w-12 text-white" />
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Sayfa Bulunamadı
        </h2>
        <p className="text-gray-600 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Ana Sayfaya Dön</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Geri Dön</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500">
          <p>© 2024 Kafe QR Sipariş Sistemi</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 