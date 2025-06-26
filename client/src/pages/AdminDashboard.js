import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  LogOut, 
  Users, 
  Menu as MenuIcon, 
  ShoppingCart, 
  QrCode,
  Plus,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import { useSocket } from '../contexts/SocketContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Çıkış başarılı');
      navigate('/login');
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Genel Bakış',
      icon: Coffee,
      description: 'Sistem durumu ve özet'
    },
    {
      id: 'masalar',
      label: 'Masalar',
      icon: Users,
      description: 'Masa yönetimi ve QR kodlar'
    },
    {
      id: 'menu',
      label: 'Menü',
      icon: MenuIcon,
      description: 'Ürün ve kategori yönetimi'
    },
    {
      id: 'siparisler',
      label: 'Siparişler',
      icon: ShoppingCart,
      description: 'Aktif sipariş takibi'
    },
    {
      id: 'qr',
      label: 'QR Kodlar',
      icon: QrCode,
      description: 'QR kod yönetimi'
    },
    {
      id: 'ayarlar',
      label: 'Ayarlar',
      icon: Settings,
      description: 'Sistem ayarları'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo ve Başlık */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Kafe QR Admin
              </h1>
            </div>

            {/* Sağ Taraf */}
            <div className="flex items-center space-x-4">
              {/* Bağlantı Durumu */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
                </span>
              </div>

              {/* Kullanıcı Bilgisi */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Hoş geldin, {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`card-hover cursor-pointer transition-all duration-200 ${
                  activeTab === item.id ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    activeTab === item.id ? 'bg-primary-500' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      activeTab === item.id ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-1 ${
                      activeTab === item.id ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* İçerik Alanı */}
        <div className="mt-8">
          <div className="card">
            {activeTab === 'dashboard' && (
              <div className="text-center py-12">
                <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hoş Geldiniz!
                </h3>
                <p className="text-gray-600">
                  Sol taraftaki menülerden istediğiniz işlemi seçebilirsiniz.
                </p>
              </div>
            )}

            {activeTab === 'masalar' && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Masa Yönetimi
                </h3>
                <p className="text-gray-600 mb-6">
                  Masaları yönetin ve QR kodları oluşturun.
                </p>
                <button className="btn-primary flex items-center space-x-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  <span>Yeni Masa Ekle</span>
                </button>
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="text-center py-12">
                <MenuIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Menü Yönetimi
                </h3>
                <p className="text-gray-600 mb-6">
                  Ürünleri ve kategorileri yönetin.
                </p>
                <div className="flex justify-center space-x-4">
                  <button className="btn-primary flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Yeni Ürün Ekle</span>
                  </button>
                  <button className="btn-secondary flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Yeni Kategori</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'siparisler' && (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sipariş Takibi
                </h3>
                <p className="text-gray-600">
                  Aktif siparişleri görüntüleyin ve yönetin.
                </p>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  QR Kod Yönetimi
                </h3>
                <p className="text-gray-600 mb-6">
                  QR kodları görüntüleyin ve yönetin.
                </p>
                <button className="btn-primary flex items-center space-x-2 mx-auto">
                  <QrCode className="h-4 w-4" />
                  <span>QR Kodları İndir</span>
                </button>
              </div>
            )}

            {activeTab === 'ayarlar' && (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sistem Ayarları
                </h3>
                <p className="text-gray-600">
                  Sistem ayarlarını yapılandırın.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 