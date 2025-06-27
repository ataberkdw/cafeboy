import React, { useState, useEffect } from 'react';
import { Plus, Trash2, QrCode, Eye, EyeOff, Users, X, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { masalarAPI } from '../services/api';

const MasalarYonetimi = () => {
  const [masalar, setMasalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yeniMasa, setYeniMasa] = useState({ masa_no: '', qr_code: '' });
  const [showForm, setShowForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    loadMasalar();
  }, []);

  const loadMasalar = async () => {
    try {
      setLoading(true);
      const response = await masalarAPI.getAll();
      setMasalar(response.data?.masalar || []);
    } catch (error) {
      console.error('Masalar yüklenirken hata:', error);
      toast.error('Masalar yüklenirken hata oluştu');
      setMasalar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await masalarAPI.create(yeniMasa);
      toast.success('Masa başarıyla eklendi');
      setYeniMasa({ masa_no: '', qr_code: '' });
      setShowForm(false);
      loadMasalar();
    } catch (error) {
      console.error('Masa eklenirken hata:', error);
      toast.error('Masa eklenirken hata oluştu');
    }
  };

  const handleToggle = async (id) => {
    try {
      await masalarAPI.toggle(id);
      toast.success('Masa durumu güncellendi');
      loadMasalar();
    } catch (error) {
      console.error('Masa durumu güncellenirken hata:', error);
      toast.error('Masa durumu güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu masayı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await masalarAPI.delete(id);
      toast.success('Masa başarıyla silindi');
      loadMasalar();
    } catch (error) {
      console.error('Masa silinirken hata:', error);
      toast.error('Masa silinirken hata oluştu');
    }
  };

  const handleCreateQR = async (id) => {
    try {
      await masalarAPI.createQR(id);
      toast.success('QR kod başarıyla oluşturuldu');
      loadMasalar();
    } catch (error) {
      console.error('QR kod oluşturulurken hata:', error);
      toast.error('QR kod oluşturulurken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Masalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Yeni Masa Butonu */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Masa Yönetimi</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Masa Ekle</span>
        </button>
      </div>

      {/* Yeni Masa Formu */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Masa Ekle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Masa Numarası
              </label>
              <input
                type="text"
                value={yeniMasa.masa_no}
                onChange={(e) => setYeniMasa({ ...yeniMasa, masa_no: e.target.value })}
                className="input-field"
                placeholder="Örn: Masa 1"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                Masa Ekle
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Masalar Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masalar.map((masa) => (
          <div key={masa.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {masa.masa_no}
                </h3>
                <p className="text-sm text-gray-600">
                  ID: {masa.id}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                masa.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {masa.aktif ? 'Aktif' : 'Pasif'}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleToggle(masa.id)}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium ${
                  masa.aktif 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {masa.aktif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{masa.aktif ? 'Pasif Yap' : 'Aktif Yap'}</span>
              </button>

              {masa.qr_code ? (
                <button
                  onClick={() => {
                    setSelectedQR(masa.id);
                    setShowQRModal(true);
                  }}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR Kodu Görüntüle</span>
                </button>
              ) : (
                <button
                  onClick={() => handleCreateQR(masa.id)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR Kodu Oluştur</span>
                </button>
              )}

              <button
                onClick={() => handleDelete(masa.id)}
                className="w-full btn-danger flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Masa Sil</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {masalar.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz Masa Yok
          </h3>
          <p className="text-gray-600">
            İlk masanızı eklemek için "Yeni Masa Ekle" butonuna tıklayın.
          </p>
        </div>
      )}

      {/* QR Kod Modal */}
      {showQRModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">QR Kodu Görüntüle</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center">
              <img
                src={`https://cafeboy.onrender.com/api/masalar/${selectedQR}/qr`}
                alt="QR Kodu"
                className="w-full h-auto mx-auto"
              />
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => window.open(`https://cafeboy.onrender.com/api/masalar/${selectedQR}/qr`, '_blank')}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>İndir</span>
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 btn-secondary"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasalarYonetimi; 