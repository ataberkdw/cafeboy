const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'kafe.db');
const db = new sqlite3.Database(dbPath);

const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Admin tablosu
      db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Masalar tablosu
      db.run(`CREATE TABLE IF NOT EXISTS masalar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        masa_no TEXT UNIQUE NOT NULL,
        qr_code TEXT,
        aktif BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Kategoriler tablosu
      db.run(`CREATE TABLE IF NOT EXISTS kategoriler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        sira INTEGER DEFAULT 0,
        aktif BOOLEAN DEFAULT 1
      )`);

      // Menü tablosu
      db.run(`CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kategori_id INTEGER,
        ad TEXT NOT NULL,
        aciklama TEXT,
        fiyat DECIMAL(10,2) NOT NULL,
        resim TEXT,
        stok INTEGER DEFAULT 0,
        aktif BOOLEAN DEFAULT 1,
        sira INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategoriler (id)
      )`);

      // Siparişler tablosu
      db.run(`CREATE TABLE IF NOT EXISTS siparisler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        masa_id INTEGER NOT NULL,
        toplam_fiyat DECIMAL(10,2) NOT NULL,
        durum TEXT DEFAULT 'beklemede',
        notlar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (masa_id) REFERENCES masalar (id)
      )`);

      // Sipariş detayları tablosu
      db.run(`CREATE TABLE IF NOT EXISTS siparis_detaylari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siparis_id INTEGER NOT NULL,
        menu_id INTEGER NOT NULL,
        adet INTEGER NOT NULL,
        birim_fiyat DECIMAL(10,2) NOT NULL,
        toplam_fiyat DECIMAL(10,2) NOT NULL,
        notlar TEXT,
        FOREIGN KEY (siparis_id) REFERENCES siparisler (id),
        FOREIGN KEY (menu_id) REFERENCES menu (id)
      )`);

      // Varsayılan admin kullanıcısı oluştur
      const defaultPassword = 'admin123';
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) {
          console.error('Admin şifre hash hatası:', err);
          reject(err);
          return;
        }

        db.run(`INSERT OR IGNORE INTO admin (username, password) VALUES (?, ?)`, 
          ['admin', hash], (err) => {
            if (err) {
              console.error('Admin oluşturma hatası:', err);
              reject(err);
              return;
            }
            console.log('✅ Database başarıyla başlatıldı');
            console.log('🔑 Varsayılan admin: admin / admin123');
            resolve();
          });
      });

      // Varsayılan kategoriler
      const kategoriler = [
        { ad: 'İçecekler', sira: 1 },
        { ad: 'Yemekler', sira: 2 },
        { ad: 'Tatlılar', sira: 3 },
        { ad: 'Kahvaltı', sira: 4 }
      ];

      kategoriler.forEach(kategori => {
        db.run(`INSERT OR IGNORE INTO kategoriler (ad, sira) VALUES (?, ?)`, 
          [kategori.ad, kategori.sira]);
      });

      // Varsayılan menü öğeleri
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
        db.run(`INSERT OR IGNORE INTO menu (kategori_id, ad, aciklama, fiyat, stok) VALUES (?, ?, ?, ?, ?)`, 
          [item.kategori_id, item.ad, item.aciklama, item.fiyat, item.stok]);
      });
    });
  });
};

const getDb = () => db;

module.exports = { initDatabase, getDb }; 