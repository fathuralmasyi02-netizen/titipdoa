# Panduan Penerapan & Setup Database "Titipan Doa"

Aplikasi **Titipan Doa** adalah aplikasi modern dengan desain Islami khusyuk yang dirancang untuk menerima titipan doa dari kerabat (untuk publik) dan menyajikannya dalam dashboard khusus pembacaan doa yang dapat diakses oleh Admin saat berada di tanah suci Makakkah/Madinah.

Aplikasi ini menyertakan sistem **Hybrid Storage**: otomatis mendeteksi jika konfigurasi Firebase Firestore tersedia, dan secara cerdas berpindah ke basis data offline berkinerja tinggi (**LocalStorage**) dengan mekanisme pembaruan real-time (event emission) jika belum terkonfigurasi. Dengan demikian, aplikasi dapat diuji coba tanpa hambatan langsung di preview!

---

## 1. Struktur Folder Proyek

Berikut adalah struktur berkas utama yang telah kami bangun secara modular, bersih, dan siap di-deploy:

```text
/
├── firebase-blueprint.json  <- Blueprint representasi skema Firestore (peta entitas)
├── firestore.rules          <- Aturan Keamanan ketat untuk memvalidasi input doa
├── firebase-applet-config.json <- File konfigurasi Firebase (berisi kredensial proyek)
├── package.json             <- Dependensi proyek (React, Vite, Tailwind, Firebase, Motion)
├── tsconfig.json            <- Konfigurasi kompilasi TypeScript
├── vite.config.ts           <- Bundler Vite dengan integrasi Tailwind CSS
├── src/
│   ├── types.ts             <- Kontrak Tipe Data Bersama (Interface Prayer)
│   ├── main.tsx             <- Entry-point Utama Aplikasi
│   ├── App.tsx              <- Koordinator Utama (Navigasi Tab, Tema & Animasi Latar)
│   ├── index.css            <- CSS global dengan integrasi Tailwind
│   ├── lib/
│   │   └── firebase.ts      <- Layanan Firestore & Fallback Simulasi LocalStorage
│   └── components/
│       ├── FormInput.tsx    <- Komponen Form Input Publik (Indah, Animatif, & Responsif)
│       └── DashboardAdmin.tsx <- Portal Dashboard Admin (dilengkapi PIN Keamanan & "Baca Khusyuk")
```

---

## 2. Cara Setup Database Firebase Firestore (Gratis & Mudah)

Untuk mengaktifkan database berbasis cloud yang sesungguhnya agar data Anda tersinkronisasi di seluruh dunia, ikuti langkah mudah berikut:

### Langkah A: Membuat Proyek di Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/) dan masuk menggunakan akun Google Anda.
2. Klik **Add project** (Tambah Proyek), beri nama **"Titipan Doa"**, lalu ikuti petunjuk hingga proyek siap (Anda bisa menonaktifkan Google Analytics jika ingin setup lebih instan).

### Langkah B: Mengaktifkan Cloud Firestore
1. Pada menu navigasi sebelah kiri, klik **Build** -> **Firestore Database**.
2. Klik **Create database** (Buat Basis Data).
3. Pilih lokasi server terdekat (disarankan `asia-southeast1` atau `asia-east1` untuk kecepatan akses optimal dari Indonesia/Asia).
4. Pilih **Start in test mode** untuk pengembangan awal, lalu klik **Create**.

### Langkah C: Menghubungkan Konfigurasi Firebase ke Aplikasi
1. Di halaman ikhtisar proyek Firebase (Project Overview), klik ikon gerigi **Project Settings** di pojok kiri atas.
2. Gulir ke bawah ke bagian **Your apps** dan klik ikon **Web (`</>`)** untuk mendaftarkan aplikasi web Anda. Beri nama (misal: "Titipan Doa Web").
3. Anda akan mendapatkan objek konfigurasi seperti ini:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "proyek-anda.firebaseapp.com",
     "projectId": "proyek-anda",
     "storageBucket": "proyek-anda.firebasestorage.app",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```
4. Di Google AI Studio, **buka file `firebase-applet-config.json`** yang terletak di root direktori proyek, dan tempelkan nilai kredensial di atas untuk menggantikan placeholder yang tersedia.
5. Jalankan aplikasi atau restart server. Aplikasi akan secara otomatis mendeteksi konfigurasi baru Anda dan mulai menyimpan doa langsung ke server Cloud Firestore secara real-time!

---

## 3. Aturan Keamanan Database (`firestore.rules`)

Untuk memastikan tidak ada pihak yang dapat memanipulasi dosa yang telah masuk atau meretas data, kami telah menyiapkan aturan keamanan tangguh di Berkas `firestore.rules`.

Anda dapat menyalin isi dari berkas `/firestore.rules` di proyek ini dan menempelkannya ke tab **"Rules"** di dasbor Cloud Firestore Anda pada Firebase Console, lalu klik **Publish**.

Aturan ini memastikan:
- **Public Create:** Siapa pun dapat menulis doa baru dengan syarat doa valid (minimum 5 karakter, status awal `isRead` wajib `false`, dan waktu pembuatan sesuai waktu server).
- **Public Read:** Doa dapat dimuat agar admin bisa membacanya.
- **Strict Update:** Pengguna hanya diijinkan memperbarui bidang `isRead` dan `updatedAt` saja demi keamanan tinggi (mencegah perubahan teks doa oleh pihak ketiga).
- **No Delete:** Doa tidak dapat dihapus oleh siapa pun untuk mencatat sejarah doa secara utuh.

---

## 4. Cara Deploy Aplikasi ke Hosting (Vercel atau Netlify)

Aplikasi ini menggunakan Vite, sehingga proses build-nya sangat cepat dan ringan.

### Deploy Memakai Vercel (Paling Direkomendasikan):
1. Buat akun di [Vercel](https://vercel.com/) dan hubungkan dengan repositori GitHub Anda.
2. Klik **Add New** -> **Project** lalu pilih repositori proyek ini.
3. Pada konfigurasi build, biarkan default:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Klik **Deploy**. Selesai! Aplikasi Anda resmi mengudara dalam 1 menit.

### Deploy Memakai Netlify:
1. Buat akun di [Netlify](https://www.netlify.com/).
2. Tarik dan lepas (drag-and-drop) folder `dist` (yang dihasilkan setelah Anda menjalankan perintah `npm run build` di terminal lokal Anda) ke area upload Netlify.
3. Atau, hubungkan akun GitHub Anda dan pilih proyek ini dengan parameter build yang sama seperti di atas.
