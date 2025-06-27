const express = require('express');
const { getDb } = require('../database/init');
const { requireKafeAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = getDb();

// Tüm kafeleri getir (admin için)
router.get('/', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM kafeler WHERE aktif = 1 ORDER BY created_at DESC`, (err, kafeler) => {
    if (err) {
      console.error('Kafeler getirme hatası:', err);
      return res.status(500).json({ error: 'Kafeler getirilemedi' });
    }
    res.json({ kafeler });
  });
});

// Kafe detayını getir
router.get('/:id', requireKafeAuth, (req, res) => {
  const kafeId = req.params.id;
  
  // Sadece kendi kafesinin bilgilerini görebilir
  if (req.kafe_id != kafeId) {
    return res.status(403).json({ error: 'Bu kafeye erişim yetkiniz yok' });
  }

  db.get(`SELECT * FROM kafeler WHERE id = ? AND aktif = 1`, [kafeId], (err, kafe) => {
    if (err) {
      console.error('Kafe detay getirme hatası:', err);
      return res.status(500).json({ error: 'Kafe detayı getirilemedi' });
    }
    
    if (!kafe) {
      return res.status(404).json({ error: 'Kafe bulunamadı' });
    }
    
    res.json({ kafe });
  });
});

// Kafe seçimi (session'a kafe_id ekle)
router.post('/select/:id', requireKafeAuth, (req, res) => {
  const kafeId = req.params.id;
  
  // Kafe'nin var olup olmadığını kontrol et
  db.get(`SELECT * FROM kafeler WHERE id = ? AND aktif = 1`, [kafeId], (err, kafe) => {
    if (err) {
      console.error('Kafe kontrol hatası:', err);
      return res.status(500).json({ error: 'Kafe kontrolü yapılamadı' });
    }
    
    if (!kafe) {
      return res.status(404).json({ error: 'Kafe bulunamadı' });
    }
    
    // Session'a kafe_id'yi ekle
    req.session.kafe_id = kafeId;
    req.session.kafe_adi = kafe.ad;
    
    res.json({ 
      message: 'Kafe seçimi başarılı',
      kafe: {
        id: kafe.id,
        ad: kafe.ad,
        domain: kafe.domain
      }
    });
  });
});

// Kafe güncelle
router.put('/:id', requireAdmin, (req, res) => {
  const kafeId = req.params.id;
  const { ad, domain, logo, telefon, adres, ayarlar } = req.body;
  
  // Sadece kendi kafesini güncelleyebilir
  if (req.kafe_id != kafeId) {
    return res.status(403).json({ error: 'Bu kafeyi güncelleme yetkiniz yok' });
  }

  db.run(`
    UPDATE kafeler 
    SET ad = ?, domain = ?, logo = ?, telefon = ?, adres = ?, ayarlar = ?
    WHERE id = ?
  `, [ad, domain, logo, telefon, adres, ayarlar, kafeId], function(err) {
    if (err) {
      console.error('Kafe güncelleme hatası:', err);
      return res.status(500).json({ error: 'Kafe güncellenemedi' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Kafe bulunamadı' });
    }
    
    res.json({ message: 'Kafe başarıyla güncellendi' });
  });
});

// Kafe oluştur (admin için)
router.post('/', requireAdmin, (req, res) => {
  const { ad, domain, logo, telefon, adres, ayarlar } = req.body;
  
  if (!ad) {
    return res.status(400).json({ error: 'Kafe adı gerekli' });
  }

  db.run(`
    INSERT INTO kafeler (ad, domain, logo, telefon, adres, ayarlar)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [ad, domain, logo, telefon, adres, ayarlar], function(err) {
    if (err) {
      console.error('Kafe oluşturma hatası:', err);
      return res.status(500).json({ error: 'Kafe oluşturulamadı' });
    }
    
    res.status(201).json({ 
      message: 'Kafe başarıyla oluşturuldu',
      kafe_id: this.lastID
    });
  });
});

module.exports = router; 