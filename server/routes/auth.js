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

  db.get('SELECT * FROM admin WHERE username = ?', [username], (err, admin) => {
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

      // Session'a admin bilgilerini kaydet
      req.session.adminId = admin.id;
      req.session.username = admin.username;

      console.log('✅ Login başarılı, session oluşturuldu');

      res.json({
        message: 'Giriş başarılı',
        admin: {
          id: admin.id,
          username: admin.username
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
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }

  db.get('SELECT id, username, created_at FROM admin WHERE id = ?', 
    [req.session.adminId], (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Database hatası' });
      }

      if (!admin) {
        return res.status(404).json({ error: 'Admin bulunamadı' });
      }

      res.json({ admin });
    });
});

module.exports = router; 