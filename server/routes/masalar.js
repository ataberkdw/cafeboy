const express = require('express');
const QRCode = require('qrcode');
const { getDb } = require('../database/init');
const { masaCreateSchema, validate } = require('../validation/schemas');
const { requireKafeAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// Tüm masaları getir (kafe bazlı)
router.get('/', requireKafeAuth, (req, res) => {
  db.all('SELECT * FROM masalar WHERE kafe_id = ? ORDER BY masa_no', [req.kafe_id], (err, masalar) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }
    res.json({ masalar });
  });
});

// Yeni masa oluştur (kafe bazlı)
router.post('/', requireAdmin, validate(masaCreateSchema), async (req, res) => {
  const { masa_no } = req.validatedData;

  // Masa numarasının bu kafede benzersiz olduğunu kontrol et
  db.get('SELECT id FROM masalar WHERE kafe_id = ? AND masa_no = ?', [req.kafe_id, masa_no], (err, existingMasa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (existingMasa) {
      return res.status(400).json({ error: 'Bu masa numarası zaten mevcut' });
    }

    // Masayı veritabanına kaydet (QR kod olmadan)
    db.run('INSERT INTO masalar (kafe_id, masa_no) VALUES (?, ?)', 
      [req.kafe_id, masa_no], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Masa oluşturma hatası' });
        }

        const yeniMasa = {
          id: this.lastID,
          kafe_id: req.kafe_id,
          masa_no,
          qr_code: null,
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

// QR kod oluştur/güncelle (kafe bazlı)
router.post('/:id/qr', requireAdmin, async (req, res) => {
  const { id } = req.params;

  // Masayı bu kafeye ait olduğunu kontrol et
  db.get('SELECT masa_no FROM masalar WHERE id = ? AND kafe_id = ?', [id, req.kafe_id], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    // QR kod URL'ini oluştur - Masa ID'si kullan
    const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
    const qrUrl = `${baseUrl}/menu?id=${id}`;
    
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

      // QR kodu veritabanına kaydet
      db.run('UPDATE masalar SET qr_code = ? WHERE id = ? AND kafe_id = ?', 
        [qrCode, id, req.kafe_id], function(err) {
          if (err) {
            return res.status(500).json({ error: 'QR kod kaydetme hatası' });
          }

          res.json({
            message: 'QR kod başarıyla oluşturuldu',
            qr_code: qrCode,
            qr_url: qrUrl
          });
        });
    });
  });
});

// Masa sil (kafe bazlı)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  // Masada aktif sipariş var mı kontrol et (kafe bazlı)
  db.get('SELECT COUNT(*) as count FROM siparisler WHERE masa_id = ? AND kafe_id = ? AND durum IN ("beklemede", "hazirlaniyor")', 
    [id, req.kafe_id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database hatası' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Bu masada aktif siparişler var. Önce siparişleri tamamlayın.' });
      }

      // Masayı sil (kafe bazlı)
      db.run('DELETE FROM masalar WHERE id = ? AND kafe_id = ?', [id, req.kafe_id], function(err) {
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

// Masa durumunu güncelle (aktif/pasif) - kafe bazlı
router.patch('/:id/toggle', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE masalar SET aktif = CASE WHEN aktif = 1 THEN 0 ELSE 1 END WHERE id = ? AND kafe_id = ?', 
    [id, req.kafe_id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Masa güncelleme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }

      res.json({ message: 'Masa durumu güncellendi' });
    });
});

// QR kod görüntüle (kafe bazlı)
router.get('/:id/qr', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.get('SELECT qr_code FROM masalar WHERE id = ? AND kafe_id = ?', [id, req.kafe_id], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    if (!masa.qr_code) {
      return res.status(404).json({ error: 'Bu masa için QR kod henüz oluşturulmamış' });
    }

    // Base64'ten buffer'a çevir
    const base64Data = masa.qr_code.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-masa-${id}.png"`);
    res.send(buffer);
  });
});

// Masa detaylarını getir (public - müşteri menüsü için)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM masalar WHERE id = ? AND aktif = 1', [id], (err, masa) => {
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