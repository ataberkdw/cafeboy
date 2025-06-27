import React, { useState, useEffect } from 'react';
import { QrCode, Download, Users, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { masalarAPI } from '../services/api';

const QRKodlarYonetimi = () => {
  const [masalar, setMasalar] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleDownloadAll = () => {
    // Tüm QR kodları indirme fonksiyonu (gelecekte eklenebilir)
    toast.info('Toplu indirme özelliği yakında eklenecek');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">QR kodlar yükleniyor...</p>
      </div>
    );
  }

  const masalarWithQR = masalar.filter(masa => masa.qr_code);
  const masalarWithoutQR = masalar.filter(masa => !masa.qr_code);

  return (
    <div className="space-y-6">
      {/* Başlık ve Toplu İndirme Butonu */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">QR Kod Yönetimi</h2>
        <button
          onClick={handleDownloadAll}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Tümünü İndir</span>
        </button>
      </div>

      {/* QR Kodları Olan Masalar */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          QR Kodları Oluşturulmuş Masalar ({masalarWithQR.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masalarWithQR.map((masa) => (
            <div key={masa.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {masa.masa_no}
                  </h4>
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
                  onClick={() => {
                    setSelectedQR(masa.id);
                    setShowQRModal(true);
                  }}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR Kodu Görüntüle</span>
                </button>

                <button
                  onClick={() => window.open(`https://cafeboy.onrender.com/api/masalar/${masa.id}/qr`, '_blank')}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>QR Kodu İndir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Kodları Olmayan Masalar */}
      {masalarWithoutQR.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            QR Kodları Oluşturulmamış Masalar ({masalarWithoutQR.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masalarWithoutQR.map((masa) => (
              <div key={masa.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {masa.masa_no}
                    </h4>
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

                <button
                  onClick={() => handleCreateQR(masa.id)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR Kodu Oluştur</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {masalar.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz Masa Yok
          </h3>
          <p className="text-gray-600">
            QR kodları oluşturmak için önce masalar ekleyin.
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

export default QRKodlarYonetimi; 