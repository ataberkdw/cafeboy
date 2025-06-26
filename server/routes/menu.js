const express = require('express');
const { getDb } = require('../database/init');
const { menuCreateSchema, menuUpdateSchema, kategoriSchema, validate } = require('../validation/schemas');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// === KATEGORİ ROUTES ===

// Tüm kategorileri getir
router.get('/kategoriler', (req, res) => {
  db.all('SELECT * FROM kategoriler WHERE aktif = 1 ORDER BY sira, ad', (err, kategoriler) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }
    res.json({ kategoriler });
  });
});

// Yeni kategori oluştur
router.post('/kategoriler', requireAuth, validate(kategoriSchema), (req, res) => {
  const { ad, sira } = req.validatedData;

  db.run('INSERT INTO kategoriler (ad, sira) VALUES (?, ?)', 
    [ad, sira || 0], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Kategori oluşturma hatası' });
      }

      const yeniKategori = {
        id: this.lastID,
        ad,
        sira: sira || 0,
        aktif: 1
      };

      res.status(201).json({
        message: 'Kategori başarıyla oluşturuldu',
        kategori: yeniKategori
      });
    });
});

// Kategori güncelle
router.put('/kategoriler/:id', requireAuth, validate(kategoriSchema), (req, res) => {
  const { id } = req.params;
  const { ad, sira } = req.validatedData;

  db.run('UPDATE kategoriler SET ad = ?, sira = ? WHERE id = ?', 
    [ad, sira || 0, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Kategori güncelleme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
      }

      res.json({ message: 'Kategori başarıyla güncellendi' });
    });
});

// Kategori sil
router.delete('/kategoriler/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  // Kategoride ürün var mı kontrol et
  db.get('SELECT COUNT(*) as count FROM menu WHERE kategori_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (result.count > 0) {
      return res.status(400).json({ error: 'Bu kategoride ürünler var. Önce ürünleri silin.' });
    }

    db.run('DELETE FROM kategoriler WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Kategori silme hatası' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
      }

      res.json({ message: 'Kategori başarıyla silindi' });
    });
  });
});

// === MENÜ ROUTES ===

// Tüm menüyü kategorilerle birlikte getir
router.get('/', (req, res) => {
  const query = `
    SELECT 
      m.*,
      k.ad as kategori_ad,
      k.sira as kategori_sira
    FROM menu m
    LEFT JOIN kategoriler k ON m.kategori_id = k.id
    WHERE m.aktif = 1
    ORDER BY k.sira, k.ad, m.sira, m.ad
  `;

  db.all(query, (err, menu) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    // Kategorilere göre grupla
    const menuByCategory = menu.reduce((acc, item) => {
      const kategoriAd = item.kategori_ad || 'Kategorisiz';
      if (!acc[kategoriAd]) {
        acc[kategoriAd] = [];
      }
      acc[kategoriAd].push({
        id: item.id,
        ad: item.ad,
        aciklama: item.aciklama,
        fiyat: item.fiyat,
        resim: item.resim,
        stok: item.stok,
        sira: item.sira
      });
      return acc;
    }, {});

    res.json({ menu: menuByCategory });
  });
});

// Tek ürün detayı
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      m.*,
      k.ad as kategori_ad
    FROM menu m
    LEFT JOIN kategoriler k ON m.kategori_id = k.id
    WHERE m.id = ? AND m.aktif = 1
  `;

  db.get(query, [id], (err, urun) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!urun) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json({ urun });
  });
});

// Yeni ürün ekle
router.post('/', requireAuth, validate(menuCreateSchema), (req, res) => {
  const { kategori_id, ad, aciklama, fiyat, stok, resim, sira } = req.validatedData;

  db.run('INSERT INTO menu (kategori_id, ad, aciklama, fiyat, stok, resim, sira) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [kategori_id, ad, aciklama, fiyat, stok || 0, resim, sira || 0], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Ürün oluşturma hatası' });
      }

      const yeniUrun = {
        id: this.lastID,
        kategori_id,
        ad,
        aciklama,
        fiyat,
        stok: stok || 0,
        resim,
        sira: sira || 0,
        aktif: 1
      };

      res.status(201).json({
        message: 'Ürün başarıyla oluşturuldu',
        urun: yeniUrun
      });
    });
});

// Ürün güncelle
router.put('/:id', requireAuth, validate(menuUpdateSchema), (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedData;

  // Dinamik güncelleme sorgusu oluştur
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  if (fields.length === 0) {
    return res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const query = `UPDATE menu SET ${setClause} WHERE id = ?`;

  db.run(query, [...values, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Ürün güncelleme hatası' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json({ message: 'Ürün başarıyla güncellendi' });
  });
});

// Ürün sil
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE menu SET aktif = 0 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Ürün silme hatası' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json({ message: 'Ürün başarıyla silindi' });
  });
});

module.exports = router; 