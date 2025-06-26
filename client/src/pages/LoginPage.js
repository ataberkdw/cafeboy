import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      toast.success('Giriş başarılı!');
      navigate('/admin');
    } else {
      toast.error(result.error || 'Giriş başarısız');
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo ve Başlık */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-500 rounded-full flex items-center justify-center mb-4">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Kafe QR
          </h2>
          <p className="text-gray-600">
            Admin Paneli Girişi
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kullanıcı Adı */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Kullanıcı adınızı girin"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Şifrenizi girin"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Giriş Yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Demo Bilgileri */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Giriş Bilgileri:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Kullanıcı Adı:</strong> admin</p>
              <p><strong>Şifre:</strong> admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Kafe QR Sipariş Sistemi</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 