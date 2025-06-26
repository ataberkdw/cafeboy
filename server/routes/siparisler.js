const express = require('express');
const { getDb } = require('../database/init');
const { siparisCreateSchema, siparisUpdateSchema, validate } = require('../validation/schemas');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// Tüm aktif siparişleri getir (admin)
router.get('/', requireAuth, (req, res) => {
  const query = `
    SELECT 
      s.*,
      m.masa_no,
      COUNT(sd.id) as urun_sayisi
    FROM siparisler s
    LEFT JOIN masalar m ON s.masa_id = m.id
    LEFT JOIN siparis_detaylari sd ON s.id = sd.siparis_id
    WHERE s.durum IN ('beklemede', 'hazirlaniyor', 'tamamlandi')
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  db.all(query, (err, siparisler) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }
    res.json({ siparisler });
  });
});

// Masa bazında siparişleri getir (müşteri)
router.get('/masa/:masaNo', (req, res) => {
  const { masaNo } = req.params;

  db.get('SELECT id FROM masalar WHERE masa_no = ? AND aktif = 1', [masaNo], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    const query = `
      SELECT 
        s.*,
        m.masa_no
      FROM siparisler s
      LEFT JOIN masalar m ON s.masa_id = m.id
      WHERE s.masa_id = ? AND s.durum IN ('beklemede', 'hazirlaniyor', 'tamamlandi')
      ORDER BY s.created_at DESC
    `;

    db.all(query, [masa.id], (err, siparisler) => {
      if (err) {
        return res.status(500).json({ error: 'Database hatası' });
      }
      res.json({ siparisler });
    });
  });
});

// Sipariş detaylarını getir
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const siparisQuery = `
    SELECT 
      s.*,
      m.masa_no
    FROM siparisler s
    LEFT JOIN masalar m ON s.masa_id = m.id
    WHERE s.id = ?
  `;

  db.get(siparisQuery, [id], (err, siparis) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!siparis) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    const detayQuery = `
      SELECT 
        sd.*,
        menu.ad as urun_adi,
        menu.aciklama as urun_aciklama,
        menu.resim as urun_resim
      FROM siparis_detaylari sd
      LEFT JOIN menu menu ON sd.menu_id = menu.id
      WHERE sd.siparis_id = ?
    `;

    db.all(detayQuery, [id], (err, detaylar) => {
      if (err) {
        return res.status(500).json({ error: 'Database hatası' });
      }

      res.json({
        siparis,
        detaylar
      });
    });
  });
});

// Yeni sipariş oluştur (müşteri)
router.post('/', validate(siparisCreateSchema), (req, res) => {
  const { masa_id, items, notlar } = req.validatedData;

  db.get('SELECT id, masa_no FROM masalar WHERE id = ? AND aktif = 1', [masa_id], (err, masa) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!masa) {
      return res.status(400).json({ error: 'Masa bulunamadı veya aktif değil' });
    }

    const urunIds = items.map(item => item.menu_id);
    const placeholders = urunIds.map(() => '?').join(',');
    
    db.all(`SELECT id, ad, fiyat, stok FROM menu WHERE id IN (${placeholders}) AND aktif = 1`, 
      urunIds, (err, urunler) => {
        if (err) {
          return res.status(500).json({ error: 'Database hatası' });
        }

        if (urunler.length !== items.length) {
          return res.status(400).json({ error: 'Bazı ürünler bulunamadı' });
        }

        // Stok kontrolü
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const urun = urunler.find(u => u.id === item.menu_id);
          if (urun.stok < item.adet) {
            return res.status(400).json({ 
              error: `${urun.ad} için yeterli stok yok. Mevcut: ${urun.stok}` 
            });
          }
        }

        // Toplam fiyat hesapla
        let toplamFiyat = 0;
        items.forEach(item => {
          const urun = urunler.find(u => u.id === item.menu_id);
          toplamFiyat += urun.fiyat * item.adet;
        });

        // Transaction başlat
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run('INSERT INTO siparisler (masa_id, toplam_fiyat, notlar) VALUES (?, ?, ?)', 
            [masa_id, toplamFiyat, notlar], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Sipariş oluşturma hatası' });
              }

              const siparisId = this.lastID;
              let completed = 0;

              items.forEach(item => {
                const urun = urunler.find(u => u.id === item.menu_id);
                const detayToplam = urun.fiyat * item.adet;

                db.run('INSERT INTO siparis_detaylari (siparis_id, menu_id, adet, birim_fiyat, toplam_fiyat, notlar) VALUES (?, ?, ?, ?, ?, ?)', 
                  [siparisId, item.menu_id, item.adet, urun.fiyat, detayToplam, item.notlar], (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Sipariş detayı ekleme hatası' });
                    }

                    db.run('UPDATE menu SET stok = stok - ? WHERE id = ?', 
                      [item.adet, item.menu_id], (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: 'Stok güncelleme hatası' });
                        }

                        completed++;
                        if (completed === items.length) {
                          db.run('COMMIT', (err) => {
                            if (err) {
                              return res.status(500).json({ error: 'Transaction commit hatası' });
                            }

                            const io = req.app.get('io');
                            io.to('admin-room').emit('siparis-geldi', {
                              siparisId,
                              masaNo: masa.masa_no,
                              toplamFiyat
                            });

                            res.status(201).json({
                              message: 'Sipariş başarıyla oluşturuldu',
                              siparisId,
                              toplamFiyat
                            });
                          });
                        }
                      });
                  });
              });
            });
        });
      });
    });
});


// Sipariş durumunu güncelle (admin)
router.patch('/:id/durum', requireAuth, validate(siparisUpdateSchema), (req, res) => {
  const { id } = req.params;
  const { durum, notlar } = req.validatedData;

  db.run('UPDATE siparisler SET durum = ?, notlar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [durum, notlar, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Sipariş güncelleme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      const io = req.app.get('io');
      io.to('admin-room').emit('siparis-guncellendi', {
        siparisId: id,
        durum
      });

      res.json({ message: 'Sipariş durumu güncellendi' });
    });
});

// Siparişi tamamla (admin)
router.post('/:id/tamamla', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE siparisler SET durum = "tamamlandi", updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Sipariş güncelleme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      const io = req.app.get('io');
      io.to('admin-room').emit('siparis-guncellendi', {
        siparisId: id,
        durum: 'tamamlandi'
      });

      res.json({ message: 'Sipariş tamamlandı' });
    });
});

// Siparişi temizle (admin - ödeme alındı)
router.post('/:id/temizle', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE siparisler SET durum = "teslim_edildi", updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Sipariş güncelleme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      const io = req.app.get('io');
      io.to('admin-room').emit('siparis-guncellendi', {
        siparisId: id,
        durum: 'teslim_edildi'
      });

      res.json({ message: 'Sipariş temizlendi' });
    });
});

module.exports = router; 