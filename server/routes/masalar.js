const express = require('express');
const QRCode = require('qrcode');
const { getDb } = require('../database/init');
const { masaCreateSchema, validate } = require('../validation/schemas');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// Tüm masaları getir
router.get('/', requireAuth, (req, res) => {
  db.all('SELECT * FROM masalar ORDER BY masa_no', (err, masalar) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }
    res.json({ masalar });
  });
});

// Yeni masa oluştur
router.post('/', requireAuth, validate(masaCreateSchema), async (req, res) => {
  const { masa_no } = req.validatedData;

  // Masa numarasının benzersiz olduğunu kontrol et
  db.get('SELECT id FROM masalar WHERE masa_no = ?', [masa_no], (err, existingMasa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (existingMasa) {
      return res.status(400).json({ error: 'Bu masa numarası zaten mevcut' });
    }

    // QR kod URL'ini oluştur
    const qrUrl = `${req.protocol}://${req.get('host')}/menu?masa=${masa_no}`;
    
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

      // Masayı veritabanına kaydet
      db.run('INSERT INTO masalar (masa_no, qr_code) VALUES (?, ?)', 
        [masa_no, qrCode], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Masa oluşturma hatası' });
          }

          const yeniMasa = {
            id: this.lastID,
            masa_no,
            qr_code: qrCode,
            aktif: 1,
            created_at: new Date().toISOString()
          };

          res.status(201).json({
            message: 'Masa başarıyla oluşturuldu',
            masa: yeniMasa
          });
        });
    });
  });
});

// Masa sil
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  // Masada aktif sipariş var mı kontrol et
  db.get('SELECT COUNT(*) as count FROM siparisler WHERE masa_id = ? AND durum IN ("beklemede", "hazirlaniyor")', 
    [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database hatası' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Bu masada aktif siparişler var. Önce siparişleri tamamlayın.' });
      }

      // Masayı sil
      db.run('DELETE FROM masalar WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Masa silme hatası' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Masa bulunamadı' });
        }

        res.json({ message: 'Masa başarıyla silindi' });
      });
    });
});

// Masa durumunu güncelle (aktif/pasif)
router.patch('/:id/toggle', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE masalar SET aktif = CASE WHEN aktif = 1 THEN 0 ELSE 1 END WHERE id = ?', 
    [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Masa güncelleme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }

      res.json({ message: 'Masa durumu güncellendi' });
    });
});

// Masa detaylarını getir
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM masalar WHERE id = ?', [id], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({ masa });
  });
});

module.exports = router; 