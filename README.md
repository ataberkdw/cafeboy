# 🍽️ Kafe QR Sipariş Sistemi

Modern kafeler için QR tabanlı dijital sipariş yönetim sistemi. Müşteriler QR kod ile menüye erişir, admin paneli ile siparişler anlık takip edilir.

## ✨ Özellikler

### 🔐 Admin Paneli
- **Güvenli Giriş**: Session tabanlı authentication
- **Masa Yönetimi**: Masaları oluştur, sil, QR kod üret
- **Menü Yönetimi**: Kategoriler ve ürünler ekle/düzenle/sil
- **Sipariş Takibi**: Anlık sipariş görüntüleme ve durum güncelleme
- **QR Kod Yönetimi**: Toplu QR kod indirme ve yeniden oluşturma

### 📱 Müşteri Deneyimi
- **QR Kod Erişimi**: Masadaki QR'ı okutarak menüye erişim
- **Mobil Uyumlu**: Responsive tasarım, PWA desteği
- **Kategori Filtreleme**: Kolay ürün bulma
- **Sepet Yönetimi**: Ürün ekleme, adet değiştirme
- **Anlık Sipariş**: Tek tıkla sipariş gönderme

### 🔄 Realtime Özellikler
- **WebSocket Bağlantısı**: Anlık sipariş bildirimleri
- **Otomatik Güncelleme**: Menü ve sipariş durumu
- **Bağlantı Durumu**: Gerçek zamanlı bağlantı takibi

## 🛠️ Teknolojiler

### Backend
- **Node.js** + **Express.js** - API server
- **SQLite** - Veritabanı
- **Socket.IO** - Realtime iletişim
- **bcryptjs** - Şifre hashleme
- **qrcode** - QR kod üretimi
- **zod** - Veri validasyonu
- **express-session** - Session yönetimi

### Frontend
- **React 18** - UI framework
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Query** - Server state
- **React Router** - Routing
- **Socket.IO Client** - Realtime
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+ 
- npm veya yarn

### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd kafe-qr-siparis
```

### 2. Bağımlılıkları Yükleyin
```bash
# Tüm bağımlılıkları yükle
npm run install-all

# Veya manuel olarak:
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Veritabanını Başlatın
```bash
cd server
npm run dev
```

### 4. Frontend'i Başlatın
```bash
cd client
npm start
```

### 5. Erişim
- **Admin Panel**: http://localhost:3000/admin
- **Müşteri Menü**: http://localhost:3000/menu?masa=1
- **API**: http://localhost:5000/api

## 🔑 Varsayılan Giriş Bilgileri

```
Kullanıcı Adı: admin
Şifre: admin123
```

## 📁 Proje Yapısı

```
kafe-qr-siparis/
├── server/                 # Backend
│   ├── database/          # Database işlemleri
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── validation/       # Zod schemas
│   └── index.js          # Server entry
├── client/                # Frontend
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── stores/       # Zustand stores
│   │   └── App.js        # Main app
│   └── package.json
└── package.json          # Root package
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` - Admin girişi
- `POST /api/auth/logout` - Admin çıkışı
- `GET /api/auth/me` - Mevcut admin bilgisi

### Masalar
- `GET /api/masalar` - Tüm masaları getir
- `POST /api/masalar` - Yeni masa oluştur
- `DELETE /api/masalar/:id` - Masa sil
- `PATCH /api/masalar/:id/toggle` - Masa durumu değiştir

### Menü
- `GET /api/menu` - Menü listesi (kategorili)
- `POST /api/menu` - Yeni ürün ekle
- `PUT /api/menu/:id` - Ürün güncelle
- `DELETE /api/menu/:id` - Ürün sil
- `GET /api/menu/kategoriler` - Kategorileri getir

### Siparişler
- `GET /api/siparisler` - Aktif siparişleri getir (admin)
- `GET /api/siparisler/masa/:masaNo` - Masa siparişleri (müşteri)
- `POST /api/siparisler` - Yeni sipariş oluştur
- `PATCH /api/siparisler/:id/durum` - Sipariş durumu güncelle
- `POST /api/siparisler/:id/tamamla` - Siparişi tamamla
- `POST /api/siparisler/:id/temizle` - Siparişi temizle

### QR Kodlar
- `GET /api/qrcode/:masaId` - Masa QR kodunu getir
- `POST /api/qrcode/:masaId/regenerate` - QR kodu yeniden oluştur
- `GET /api/qrcode/download/all` - Tüm QR kodları indir

## 🔄 WebSocket Events

### Client → Server
- `join-admin` - Admin odasına katıl

### Server → Client
- `siparis-geldi` - Yeni sipariş bildirimi
- `siparis-guncellendi` - Sipariş durumu güncelleme

## 📱 PWA Özellikleri

- **Offline Desteği**: Temel işlevler offline çalışır
- **App-like Deneyim**: Tam ekran modu
- **Push Notifications**: Sipariş bildirimleri (gelecek)
- **Install Prompt**: Ana ekrana ekleme

## 🎨 Tasarım Sistemi

### Renkler
- **Primary**: Turuncu (#ed7516)
- **Secondary**: Gri tonları
- **Success**: Yeşil (#10b981)
- **Error**: Kırmızı (#ef4444)

### Bileşenler
- **Buttons**: Primary, Secondary, Danger
- **Cards**: Hover efektli kartlar
- **Inputs**: Focus states ile form alanları
- **Modals**: Bottom sheet tarzı modaller

## 🔧 Geliştirme

### Scripts
```bash
# Geliştirme modu (hem frontend hem backend)
npm run dev

# Sadece backend
npm run server

# Sadece frontend
npm run client

# Production build
npm run build
```

### Environment Variables
```env
# Backend (.env)
PORT=5000
SESSION_SECRET=your-secret-key
NODE_ENV=development

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
```

## 🚀 Deployment

### Backend (Heroku/Netlify Functions)
```bash
cd server
npm run build
```

### Frontend (Netlify/Vercel)
```bash
cd client
npm run build
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Proje**: [GitHub Repository](https://github.com/your-username/kafe-qr-siparis)
- **Email**: your-email@example.com

## 🙏 Teşekkürler

- [React](https://reactjs.org/) - UI Framework
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework
- [Zustand](https://github.com/pmndrs/zustand) - State Management
- [Socket.IO](https://socket.io/) - Realtime Communication
- [Lucide](https://lucide.dev/) - Icons

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 