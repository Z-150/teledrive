# Rencana Implementasi Multi-User & Bot Management

Sesuai dengan permintaan Anda yang sangat komprehensif, berikut adalah rancangan implementasinya. Karena fitur ini berskala besar, kita akan membaginya ke dalam beberapa tahap.

## 1. Modifikasi Database (SQLite)
Kita akan menambahkan tabel baru di `schema.prisma`:
- `Registrations`: Menyimpan data pendaftar (IP Address, Telegram Username/Nomor, Status: `PENDING_OTP`, `PENDING_ADMIN`, `APPROVED`, `REJECTED`).
- *Rate Limiting*: Sebelum insert ke tabel ini, API akan mengecek jumlah pendaftaran dari IP yang sama dalam 7 hari terakhir (Maksimal 2 kali/minggu).

## 2. Alur Registrasi Web & OTP Bot
Telegram memiliki aturan ketat: **Bot tidak bisa memulai chat ke pengguna**. Pengguna *wajib* menekan tombol Start di bot terlebih dahulu.
Maka alurnya agar bebas spam:
1. Di halaman Login Web, user memilih **Register**.
2. User memasukkan Username Telegram/Nomor HP.
3. Web memvalidasi IP (max 2/minggu) lalu memberikan sebuah **Kode OTP / Token**.
4. Web menginstruksikan user: *"Silakan chat bot kami @NamaBot Anda dan kirimkan kode OTP ini untuk verifikasi."*(langsung berikan link otp nya misal "t.me/namabot?start=kodeOTP"
5. User chat bot dengan kode tersebut. 
6. Bot memverifikasi OTP, lalu memberi tahu Admin: *"Ada pendaftaran baru dari @username. Terima/Tolak?"*

*Catatan: Bot akan didesain untuk **mengabaikan/tidak merespons** chat apapun selain dari user yang sudah punya akun, kecuali jika mereka mengirimkan kode OTP pendaftaran.*

## 3. Bot Management (Khusus Admin)
Kita akan menginstal library `grammy`(telegraf jelek) (library Bot Telegram terbaik di Node.js) ke dalam backend Anda.
Bot ini akan memiliki menu interaktif dengan **Inline Keyboard** & **Unicode/Emoji** (seperti 🚀, ⚙️, 👑, 🗑️) untuk mempercantik UI bot.
**Fitur Bot Admin:**
- 🔔 Menerima notifikasi pendaftaran baru.
- ✅ Tombol interaktif **[Terima]** / **[Tolak]** pendaftaran.(gunakan style button merah dan hijau)
- 👥 Menu daftar pengguna.(gunakan table)
- 👑 Set/Hapus status **Premium** pengguna.
- 🗑️ Hapus pengguna.

## 4. Limitasi Ukuran File
Di endpoint *Upload* (`Files.ts`), kita akan menyuntikkan logika limitasi:
- **Normal User**: Maksimal ukuran file yang diizinkan untuk di-upload adalah **1 GB**.
- **Premium User**: Maksimal **2 GB** (atau batas asli Telegram).
Jika user biasa mencoba upload > 1 GB, API akan merespons error: *"Upgrade ke Premium untuk upload file lebih dari 1GB!"*

---
**Apakah rancangan alur di atas sudah sesuai dengan bayangan Anda?** Jika ya, saya akan mulai melakukan instalasi `grammy` dan mengeksekusi Tahap 1 (Database) & Tahap 2 (Bot Setup)!
