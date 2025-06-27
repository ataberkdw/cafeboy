import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Menu as MenuIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { menuAPI } from '../services/api';

const MenuYonetimi = () => {
  const [menu, setMenu] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    aciklama: '',
    fiyat: '',
    kategori_id: '',
    stok: '',
    aktif: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuResponse, kategorilerResponse] = await Promise.all([
        menuAPI.getAdmin(),
        menuAPI.getKategoriler()
      ]);
      setMenu(menuResponse.data || []);
      setKategoriler(kategorilerResponse.data?.kategoriler || []);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      toast.error('Veri yüklenirken hata oluştu');
      setMenu([]);
      setKategoriler([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuAPI.update(editingItem.id, formData);
        toast.success('Ürün başarıyla güncellendi');
      } else {
        await menuAPI.create(formData);
        toast.success('Ürün başarıyla eklendi');
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Ürün kaydedilirken hata:', error);
      toast.error('Ürün kaydedilirken hata oluştu');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ad: item.ad,
      aciklama: item.aciklama || '',
      fiyat: item.fiyat.toString(),
      kategori_id: item.kategori_id?.toString() || '',
      stok: item.stok?.toString() || '0',
      aktif: item.aktif
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await menuAPI.delete(id);
      toast.success('Ürün başarıyla silindi');
      loadData();
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
      toast.error('Ürün silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      ad: '',
      aciklama: '',
      fiyat: '',
      kategori_id: '',
      stok: '',
      aktif: true
    });
    setEditingItem(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Menü yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Yeni Ürün Butonu */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {/* Yeni Ürün Formu */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="input-field"
                  placeholder="Ürün adı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.kategori_id}
                  onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Kategori seçin</option>
                  {kategoriler.map((kategori) => (
                    <option key={kategori.id} value={kategori.id}>
                      {kategori.ad}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fiyat}
                  onChange={(e) => setFormData({ ...formData, fiyat: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok
                </label>
                <input
                  type="number"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Ürün açıklaması"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Aktif</span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                {editingItem ? 'Güncelle' : 'Ürün Ekle'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menü Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item) => (
          <div key={item.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.ad}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {kategoriler.find(k => k.id === item.kategori_id)?.ad || 'Kategorisiz'}
                </p>
                {item.aciklama && (
                  <p className="text-sm text-gray-500 mb-2">
                    {item.aciklama}
                  </p>
                )}
                <p className="text-lg font-bold text-primary-600">
                  ₺{parseFloat(item.fiyat).toFixed(2)}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {item.aktif ? 'Aktif' : 'Pasif'}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <span>Stok: {item.stok || 0}</span>
              <span>ID: {item.id}</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 btn-secondary flex items-center justify-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Düzenle</span>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 btn-danger flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sil</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {menu.length === 0 && (
        <div className="text-center py-12">
          <MenuIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz Ürün Yok
          </h3>
          <p className="text-gray-600">
            İlk ürününüzü eklemek için "Yeni Ürün Ekle" butonuna tıklayın.
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuYonetimi; 