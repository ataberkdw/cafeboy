const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'kafe.db');
const db = new sqlite3.Database(dbPath);

const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Kafeler tablosu (YENİ)
      db.run(`CREATE TABLE IF NOT EXISTS kafeler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        domain TEXT UNIQUE,
        logo TEXT,
        telefon TEXT,
        adres TEXT,
        ayarlar TEXT,
        aktif BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Admin tablosu (kafe_id eklendi)
      db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kafe_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kafe_id) REFERENCES kafeler (id),
        UNIQUE(kafe_id, username)
      )`);

      // Masalar tablosu (kafe_id eklendi)
      db.run(`CREATE TABLE IF NOT EXISTS masalar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kafe_id INTEGER NOT NULL,
        masa_no TEXT NOT NULL,
        qr_code TEXT,
        aktif BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kafe_id) REFERENCES kafeler (id),
        UNIQUE(kafe_id, masa_no)
      )`);

      // Kategoriler tablosu (kafe_id eklendi)
      db.run(`CREATE TABLE IF NOT EXISTS kategoriler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kafe_id INTEGER NOT NULL,
        ad TEXT NOT NULL,
        sira INTEGER DEFAULT 0,
        aktif BOOLEAN DEFAULT 1,
        FOREIGN KEY (kafe_id) REFERENCES kafeler (id)
      )`);

      // Menü tablosu (kafe_id eklendi)
      db.run(`CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kafe_id INTEGER NOT NULL,
        kategori_id INTEGER,
        ad TEXT NOT NULL,
        aciklama TEXT,
        fiyat DECIMAL(10,2) NOT NULL,
        resim TEXT,
        stok INTEGER DEFAULT 0,
        aktif BOOLEAN DEFAULT 1,
        sira INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kafe_id) REFERENCES kafeler (id),
        FOREIGN KEY (kategori_id) REFERENCES kategoriler (id)
      )`);

      // Siparişler tablosu (kafe_id eklendi)
      db.run(`CREATE TABLE IF NOT EXISTS siparisler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kafe_id INTEGER NOT NULL,
        masa_id INTEGER NOT NULL,
        toplam_fiyat DECIMAL(10,2) NOT NULL,
        durum TEXT DEFAULT 'beklemede',
        notlar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kafe_id) REFERENCES kafeler (id),
        FOREIGN KEY (masa_id) REFERENCES masalar (id)
      )`);

      // Sipariş detayları tablosu (kafe_id eklendi)
      db.run(`CREATE TABLE IF NOT EXISTS siparis_detaylari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kafe_id INTEGER NOT NULL,
        siparis_id INTEGER NOT NULL,
        menu_id INTEGER NOT NULL,
        adet INTEGER NOT NULL,
        birim_fiyat DECIMAL(10,2) NOT NULL,
        toplam_fiyat DECIMAL(10,2) NOT NULL,
        notlar TEXT,
        FOREIGN KEY (kafe_id) REFERENCES kafeler (id),
        FOREIGN KEY (siparis_id) REFERENCES siparisler (id),
        FOREIGN KEY (menu_id) REFERENCES menu (id)
      )`);

      // Varsayılan kafe oluştur
      db.run(`INSERT OR IGNORE INTO kafeler (id, ad, domain) VALUES (1, 'Demo Kafe', 'demo')`, (err) => {
        if (err) {
          console.error('Demo kafe oluşturma hatası:', err);
          reject(err);
          return;
        }

        // Varsayılan admin kullanıcısı oluştur (kafe_id ile)
        const defaultPassword = 'admin123';
        bcrypt.hash(defaultPassword, 10, (err, hash) => {
          if (err) {
            console.error('Admin şifre hash hatası:', err);
            reject(err);
            return;
          }

          db.run(`INSERT OR IGNORE INTO admin (kafe_id, username, password) VALUES (?, ?, ?)`, 
            [1, 'admin', hash], (err) => {
              if (err) {
                console.error('Admin oluşturma hatası:', err);
                reject(err);
                return;
              }
              console.log('✅ Database başarıyla başlatıldı');
              console.log('🏪 Demo Kafe oluşturuldu');
              console.log('🔑 Varsayılan admin: admin / admin123');
              resolve();
            });
        });

        // Varsayılan kategoriler (kafe_id ile)
        const kategoriler = [
          { ad: 'İçecekler', sira: 1 },
          { ad: 'Yemekler', sira: 2 },
          { ad: 'Tatlılar', sira: 3 },
          { ad: 'Kahvaltı', sira: 4 }
        ];

        kategoriler.forEach(kategori => {
          db.run(`INSERT OR IGNORE INTO kategoriler (kafe_id, ad, sira) VALUES (?, ?, ?)`, 
            [1, kategori.ad, kategori.sira]);
        });

        // Varsayılan menü öğeleri (kafe_id ile)
        const menuItems = [
          { kategori_id: 1, ad: 'Türk Kahvesi', aciklama: 'Geleneksel Türk Kahvesi', fiyat: 15.00, stok: 100 },
          { kategori_id: 1, ad: 'Espresso', aciklama: 'Tek shot espresso', fiyat: 12.00, stok: 100 },
          { kategori_id: 1, ad: 'Latte', aciklama: 'Sütlü kahve', fiyat: 18.00, stok: 100 },
          { kategori_id: 2, ad: 'Hamburger', aciklama: 'Dana eti hamburger', fiyat: 45.00, stok: 50 },
          { kategori_id: 2, ad: 'Pizza Margherita', aciklama: 'Domates ve mozzarella', fiyat: 55.00, stok: 30 },
          { kategori_id: 3, ad: 'Tiramisu', aciklama: 'İtalyan tatlısı', fiyat: 25.00, stok: 20 },
          { kategori_id: 4, ad: 'Serpme Kahvaltı', aciklama: 'Zengin kahvaltı tabağı', fiyat: 75.00, stok: 15 }
        ];

        menuItems.forEach(item => {
          db.run(`INSERT OR IGNORE INTO menu (kafe_id, kategori_id, ad, aciklama, fiyat, stok) VALUES (?, ?, ?, ?, ?, ?)`, 
            [1, item.kategori_id, item.ad, item.aciklama, item.fiyat, item.stok]);
        });
      });
    });
  });
};

const getDb = () => db;

module.exports = { initDatabase, getDb }; 