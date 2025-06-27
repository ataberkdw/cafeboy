import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Coffee, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { menuAPI, siparislerAPI } from '../services/api';
import useCartStore from '../stores/cartStore';

const CustomerMenu = () => {
  const [searchParams] = useSearchParams();
  const masaId = searchParams.get('id');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [masaNo, setMasaNo] = useState('');
  
  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    getItemsForOrder,
    setMasaNo: setMasaNoInStore
  } = useCartStore();

  // Masa bilgilerini getir
  const { data: masaData } = useQuery(
    ['masa', masaId],
    () => fetch(`/api/masalar/${masaId}`).then(res => res.json()),
    {
      enabled: !!masaId,
      onSuccess: (data) => {
        if (data.masa) {
          setMasaNo(data.masa.masa_no);
          setMasaNoInStore(data.masa.masa_no);
        }
      }
    }
  );

  // Masa numarasını store'a kaydet
  useEffect(() => {
    if (masaNo) {
      setMasaNoInStore(masaNo);
    }
  }, [masaNo, setMasaNoInStore]);

  // Menü verilerini getir
  const { data: menuData, isLoading: menuLoading, error: menuError } = useQuery(
    ['menu'],
    menuAPI.getAll,
    {
      refetchInterval: 30000, // 30 saniyede bir güncelle
    }
  );

  // Kategorileri getir
  const { data: kategorilerData } = useQuery(
    ['kategoriler'],
    menuAPI.getKategoriler
  );

  // Debug için console.log ekleyelim
  useEffect(() => {
    console.log('CustomerMenu mounted');
    console.log('Masa ID:', masaId);
    console.log('Masa No:', masaNo);
    console.log('Menu Data:', menuData);
    console.log('Menu Loading:', menuLoading);
    console.log('Menu Error:', menuError);
    console.log('Kategoriler Data:', kategorilerData);
  }, [masaId, masaNo, menuData, menuLoading, menuError, kategorilerData]);

  // Sipariş gönder
  const handleSubmitOrder = async () => {
    if (!masaId) {
      toast.error('Masa ID bulunamadı');
      return;
    }

    if (items.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }

    try {
      const orderData = {
        masa_id: parseInt(masaId),
        items: getItemsForOrder(),
        notlar: ''
      };

      await siparislerAPI.create(orderData);
      toast.success('Siparişiniz başarıyla gönderildi!');
      clearCart();
      setShowCart(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Sipariş gönderilirken hata oluştu');
    }
  };

  // Kategorileri filtrele
  const categories = kategorilerData?.kategoriler || [];
  const menu = menuData?.menu || {};

  // Seçili kategoriye göre ürünleri filtrele
  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : Object.keys(menu).reduce((acc, category) => {
        if (category === selectedCategory) {
          acc[category] = menu[category];
        }
        return acc;
      }, {});

  if (menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Menü yükleniyor...</p>
          <p className="text-sm text-gray-500 mt-2">Debug: Loading state</p>
        </div>
      </div>
    );
  }

  if (menuError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Coffee className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Hata Oluştu
          </h3>
          <p className="text-gray-600">Menü yüklenirken bir hata oluştu.</p>
          <p className="text-sm text-red-500 mt-2">Debug: {menuError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo ve Başlık */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Kafe QR Menü
                </h1>
                {masaNo && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Masa {masaNo}
                  </p>
                )}
              </div>
            </div>

            {/* Sepet Butonu */}
            <button
              onClick={() => setShowCart(true)}
              className="relative btn-primary flex items-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Sepet</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Debug Bilgisi */}
      <div className="bg-yellow-100 p-4 text-sm">
        <p><strong>Debug:</strong> Masa ID: {masaId} | Masa No: {masaNo} | Kategoriler: {categories.length} | Menü Kategorileri: {Object.keys(menu).length}</p>
      </div>

      {/* Kategori Filtreleri */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
            {categories.map((kategori) => (
              <button
                key={kategori.id}
                onClick={() => setSelectedCategory(kategori.ad)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === kategori.ad
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {kategori.ad}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menü İçeriği */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {Object.keys(filteredMenu).length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ürün Bulunamadı
            </h3>
            <p className="text-gray-600">
              Seçili kategoride ürün bulunmuyor.
            </p>
            <p className="text-sm text-gray-500 mt-2">Debug: Menü boş veya yüklenmedi</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredMenu).map(([categoryName, products]) => (
              <div key={categoryName}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {categoryName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="card-hover">
                      <div className="flex space-x-4">
                        {/* Ürün Resmi */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            {product.resim ? (
                              <img
                                src={product.resim}
                                alt={product.ad}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Coffee className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {product.ad}
                          </h3>
                          {product.aciklama && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {product.aciklama}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold text-primary-600">
                              ₺{product.fiyat}
                            </span>
                            <button
                              onClick={() => addItem(product)}
                              className="btn-primary flex items-center space-x-1"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Ekle</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sepet Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full max-h-[80vh] rounded-t-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Sepetiniz ({getTotalItems()} ürün)
              </h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Sepet İçeriği */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Sepetiniz boş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.ad}</h4>
                        <p className="text-sm text-gray-600">₺{item.fiyat}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₺{(item.fiyat * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sepet Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">Toplam:</span>
                  <span className="text-xl font-bold text-primary-600">
                    ₺{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Clock className="h-5 w-5" />
                  <span>Siparişi Gönder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu; 