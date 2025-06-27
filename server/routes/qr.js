const express = require('express');
const QRCode = require('qrcode');
const { getDb } = require('../database/init');
const { requireKafeAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// Masa QR kodunu getir (kafe bazlı)
router.get('/:masaId', (req, res) => {
  const { masaId } = req.params;

  db.get('SELECT masa_no, qr_code, kafe_id FROM masalar WHERE id = ? AND aktif = 1', [masaId], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({
      masa_no: masa.masa_no,
      qr_code: masa.qr_code,
      kafe_id: masa.kafe_id
    });
  });
});

// QR kod yeniden oluştur (admin - kafe bazlı)
router.post('/:masaId/regenerate', requireAdmin, (req, res) => {
  const { masaId } = req.params;

  // Masayı bu kafeye ait olduğunu kontrol et
  db.get('SELECT masa_no FROM masalar WHERE id = ? AND kafe_id = ?', [masaId, req.kafe_id], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    // Yeni QR kod oluştur - Masa ID'si kullan
    const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
    const qrUrl = `${baseUrl}/menu?id=${masaId}`;
    
    QRCode.toDataURL(qrUrl, { 
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (err, qrCode) => {
      if (err) {
        return res.status(500).json({ error: 'QR kod oluşturma hatası' });
      }

      // QR kodu güncelle (kafe bazlı)
      db.run('UPDATE masalar SET qr_code = ? WHERE id = ? AND kafe_id = ?', [qrCode, masaId, req.kafe_id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'QR kod güncelleme hatası' });
        }

        res.json({
          message: 'QR kod yeniden oluşturuldu',
          masa_no: masa.masa_no,
          qr_code: qrCode,
          qr_url: qrUrl
        });
      });
    });
  });
});

// Toplu QR kod indirme (admin - kafe bazlı)
router.get('/download/all', requireKafeAuth, (req, res) => {
  db.all('SELECT id, masa_no, qr_code FROM masalar WHERE kafe_id = ? AND aktif = 1 ORDER BY masa_no', [req.kafe_id], (err, masalar) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    res.json({
      masalar: masalar.map(masa => ({
        id: masa.id,
        masa_no: masa.masa_no,
        qr_code: masa.qr_code
      }))
    });
  });
});

module.exports = router; 