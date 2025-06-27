const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database/init');
const { loginSchema, validate } = require('../validation/schemas');

const router = express.Router();
const db = getDb();

// Admin girişi
router.post('/login', validate(loginSchema), (req, res) => {
  console.log('🔐 Login isteği alındı:', req.validatedData);
  const { username, password } = req.validatedData;

  db.get(`
    SELECT a.*, k.ad as kafe_adi, k.domain as kafe_domain 
    FROM admin a 
    JOIN kafeler k ON a.kafe_id = k.id 
    WHERE a.username = ? AND k.aktif = 1
  `, [username], (err, admin) => {
    if (err) {
      console.error('❌ Database hatası:', err);
      return res.status(500).json({ error: 'Database hatası' });
    }

    console.log('👤 Admin bulundu:', admin ? 'Evet' : 'Hayır');

    if (!admin) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    bcrypt.compare(password, admin.password, (err, isMatch) => {
      if (err) {
        console.error('❌ Şifre karşılaştırma hatası:', err);
        return res.status(500).json({ error: 'Şifre karşılaştırma hatası' });
      }

      console.log('🔑 Şifre eşleşmesi:', isMatch ? 'Başarılı' : 'Başarısız');

      if (!isMatch) {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      }

      // Session'a admin ve kafe bilgilerini kaydet
      req.session.isAuthenticated = true;
      req.session.user_id = admin.id;
      req.session.username = admin.username;
      req.session.kafe_id = admin.kafe_id;
      req.session.kafe_adi = admin.kafe_adi;

      console.log('✅ Login başarılı, session oluşturuldu');

      res.json({
        message: 'Giriş başarılı',
        admin: {
          id: admin.id,
          username: admin.username,
          kafe_id: admin.kafe_id,
          kafe_adi: admin.kafe_adi,
          kafe_domain: admin.kafe_domain
        }
      });
    });
  });
});

// Admin çıkışı
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Çıkış hatası' });
    }
    res.json({ message: 'Çıkış başarılı' });
  });
});

// Mevcut admin bilgilerini getir
router.get('/me', (req, res) => {
  if (!req.session.isAuthenticated || !req.session.user_id) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }

  db.get(`
    SELECT a.id, a.username, a.created_at, k.id as kafe_id, k.ad as kafe_adi, k.domain as kafe_domain
    FROM admin a 
    JOIN kafeler k ON a.kafe_id = k.id 
    WHERE a.id = ? AND k.aktif = 1
  `, [req.session.user_id], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database hatası' });
    }

    if (!admin) {
      return res.status(404).json({ error: 'Admin bulunamadı' });
    }

    res.json({ 
      admin,
      session: {
        isAuthenticated: req.session.isAuthenticated,
        kafe_id: req.session.kafe_id,
        kafe_adi: req.session.kafe_adi
      }
    });
  });
});

module.exports = router; 