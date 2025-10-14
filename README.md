// =============================================================================
// CODE BY NADRETH
// =====================
# Aplikasi Kuis Interaktif

Aplikasi kuis interaktif berbasis web dengan tema gelap menggunakan vanilla JavaScript, HTML, dan CSS.

## 🚀 Fitur

- ✅ **Kuis Interaktif** dengan berbagai tema/materi
- ✅ **Soal Pilihan Ganda & Essay** dengan support gambar
- ✅ **Timer Per Soal** dengan auto-submit
- ✅ **Sistem Skor** berdasarkan kecepatan jawaban
- ✅ **Sistem Lencana** untuk 5 jawaban benar beruntun
- ✅ **Leaderboard** per tema dengan top 3
- ✅ **Panel Admin** untuk mengelola soal dan tema
- ✅ **Randomisasi Soal & Jawaban** setiap sesi
- ✅ **Tema Gelap** (hitam, ungu, biru)
- ✅ **Responsif** untuk mobile dan desktop

## 📋 Persyaratan

- Browser modern dengan support JavaScript ES6+
- Koneksi internet untuk akses JSONBin.io

## 🛠️ Instalasi & Konfigurasi

### 1. Download File
Download semua file ke folder yang sama:
- `index.html`
- `styles.css` 
- `script.js`
- `README.md`

### 2. Konfigurasi JSONBin.io

**Langkah 1: Buat Akun JSONBin.io**
1. Daftar di [https://jsonbin.io/](https://jsonbin.io/)
2. Dapatkan API Key dari dashboard

**Langkah 2: Setup Bin**
1. Buat new bin di dashboard JSONBin.io
2. Copy **Bin ID** dari URL (contoh: `68e5a3d743b1c97be95e228b`)
3. Copy **Master Key** dari dashboard

**Langkah 3: Konfigurasi Aplikasi**
Edit file `script.js` dan ganti nilai berikut:

```javascript
// GANTI nilai di bawah ini dengan informasi jsonbin.io milikmu
const JSONBIN_BIN_ID = "YOUR_BIN_ID";               // contoh: "68e5a3d743b1c97be95e228b"
const JSONBIN_MASTER_KEY = "YOUR_JSONBIN_MASTER_KEY"; // JANGAN masukkan real key di repositori publik

// =============================================================================
// CODE BY NADRETH
// =====================