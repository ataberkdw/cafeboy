const express = require('express');
const QRCode = require('qrcode');
const { getDb } = require('../database/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// Masa QR kodunu getir
router.get('/:masaId', (req, res) => {
  const { masaId } = req.params;

  db.get('SELECT masa_no, qr_code FROM masalar WHERE id = ? AND aktif = 1', [masaId], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({
      masa_no: masa.masa_no,
      qr_code: masa.qr_code
    });
  });
});

// QR kod yeniden oluştur (admin)
router.post('/:masaId/regenerate', requireAuth, (req, res) => {
  const { masaId } = req.params;

  // Masayı kontrol et
  db.get('SELECT masa_no FROM masalar WHERE id = ?', [masaId], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    // Yeni QR kod oluştur
    const qrUrl = `${req.protocol}://${req.get('host')}/menu?masa=${masa.masa_no}`;
    
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

      // QR kodu güncelle
      db.run('UPDATE masalar SET qr_code = ? WHERE id = ?', [qrCode, masaId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'QR kod güncelleme hatası' });
        }

        res.json({
          message: 'QR kod yeniden oluşturuldu',
          masa_no: masa.masa_no,
          qr_code: qrCode
        });
      });
    });
  });
});

// Toplu QR kod indirme (admin)
router.get('/download/all', requireAuth, (req, res) => {
  db.all('SELECT id, masa_no, qr_code FROM masalar WHERE aktif = 1 ORDER BY masa_no', (err, masalar) => {
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