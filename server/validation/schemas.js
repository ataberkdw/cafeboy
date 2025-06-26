const { z } = require('zod');

// Auth validation
const loginSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır')
});

// Masa validation
const masaCreateSchema = z.object({
  masa_no: z.string().min(1, 'Masa numarası gerekli')
});

// Kategori validation
const kategoriSchema = z.object({
  ad: z.string().min(1, 'Kategori adı gerekli'),
  sira: z.number().int().min(0).optional()
});

// Menü validation
const menuCreateSchema = z.object({
  kategori_id: z.number().int().positive('Geçerli kategori seçin'),
  ad: z.string().min(1, 'Ürün adı gerekli'),
  aciklama: z.string().optional(),
  fiyat: z.number().positive('Fiyat pozitif olmalıdır'),
  stok: z.number().int().min(0, 'Stok negatif olamaz').optional(),
  resim: z.string().url('Geçerli resim URL\'i girin').optional()
});

const menuUpdateSchema = menuCreateSchema.partial();

// Sipariş validation
const siparisItemSchema = z.object({
  menu_id: z.number().int().positive('Geçerli menü öğesi seçin'),
  adet: z.number().int().positive('Adet pozitif olmalıdır'),
  notlar: z.string().optional()
});

const siparisCreateSchema = z.object({
  masa_id: z.number().int().positive('Geçerli masa seçin'),
  items: z.array(siparisItemSchema).min(1, 'En az bir ürün seçin'),
  notlar: z.string().optional()
});

const siparisUpdateSchema = z.object({
  durum: z.enum(['beklemede', 'hazirlaniyor', 'tamamlandi', 'teslim_edildi', 'iptal']),
  notlar: z.string().optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

module.exports = {
  loginSchema,
  masaCreateSchema,
  kategoriSchema,
  menuCreateSchema,
  menuUpdateSchema,
  siparisCreateSchema,
  siparisUpdateSchema,
  validate
}; 