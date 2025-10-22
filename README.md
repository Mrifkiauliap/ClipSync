# 📋 ClipSync — Clipboard Sync Antar Device

> Aplikasi sinkronisasi clipboard antar perangkat (PC, Laptop, Smartphone) berbasis **Node.js + Express + Sequelize + MySQL**.

---

## ✨ Fitur

- ✅ Register & Login User  
- ✅ JWT + Refresh Token + Session Management  
- ✅ Menyimpan & sinkronisasi clipboard antar device  
- ✅ Manajemen device (add / remove / track last active)  
- ✅ Menandai clipboard sebagai favorit  
- ✅ Rate limit (1000 request / 15 menit per IP)  
- ✅ Struktur projek modular & scalable  

---

## 🛠️ Tech Stack

| Layer         | Teknologi                           |
|--------------|--------------------------------------|
| Backend      | Node.js, Express.js                 |
| Database     | MySQL                               |
| ORM          | Sequelize                           |
| Auth         | JWT, Refresh Token, Bcrypt          |
| Security     | express-rate-limit, cookie-parser   |
| Utility      | dotenv, moment, multer (jika upload file) |

---

## ⚙️ Instalasi & Setup

### ✅ 1. Clone Repo
```
git clone https://github.com/username/ClipSync.git
cd ClipSync/server
```

### ✅ 2. Install Dependencies
```
npm install
```

### ✅ 3. Setup File .env
Buat file .env berdasarkan .env.example:

### ✅ 4. Setup Database
```
npx sequelize db:create
npx sequelize db:migrate
npx sequelize db:seed:all
```

### ✅ 5. Jalankan Server
```
npm run dev     # nodemon
# atau
node server.js
```

---

## ✅ Roadmap / To-Do

- Upload gambar & file pada clipboard
- Real-time sync (WebSocket)
- Aplikasi Android (Ongoing) + UI Web Dashboard (Coming soon)

---

## 📄 Lisensi

Projek ini dibuat untuk pembelajaran dan pengembangan personal.
Bebas di-clone, fork, atau dikembangkan ulang.
