# Kebijakan privasi landing page dan trial ter-hosting

Naskah resmi tayang ada di `apps/landing/src/copy.ts` (`privacy`, ID/EN) dan muncul di
`/privasi/`. File ini adalah salinan untuk peninjauan hukum dan arsip. **Setiap perubahan
dilakukan di kedua tempat dalam PR yang sama.** Pengendali: vendor PanduArah
(`panduarahid@gmail.com`). Terakhir diperbarui 12 Oktober 2026 (T-616).

| Bagian | Isi | Sumber di inventaris |
| --- | --- | --- |
| Data yang kami kumpulkan | Form trial: nama, instansi, jabatan, email, telepon, jenis dan perkiraan luas gedung, alamat IP pengirim (pencegahan penyalahgunaan). Email ke vendor: alamat, nama, isi pesan | B1, B5 |
| Untuk apa | Membuat dan menjalankan ruang kerja trial, email tentang trial (verifikasi, akses, pengingat), membalas pertanyaan, membantu instalasi, menghubungi tentang PanduArah. Tidak dijual, tidak untuk iklan pihak lain | B1, B2, B5 |
| Penyimpanan | Ruang kerja trial, berkas, dan akun trial dihapus otomatis 7 hari setelah trial berakhir. Isian form trial dan email paling lama 12 bulan, kecuali menjadi klien. Tanpa cookie pelacak; bahasa dan tema di peramban | B1, B2, B5 |
| Hak Anda | Salinan, perbaikan, atau penghapusan lewat email vendor (UU PDP) | — |
| Data pengunjung gedung | On-premise: klien adalah pengendali dan vendor tidak menerima data pengunjung. Visitor trial dan demo tanpa login dan tanpa data pribadi pengunjung | A9 |

## Yang perlu dilengkapi sebelum naskah final **[tinjau]**

- Identitas badan hukum vendor dan alamat korespondensi (saat ini hanya email).
- Lokasi pemrosesan: region project Supabase dan Cloudflare, serta apakah ada transfer data ke
  luar wilayah Indonesia (UU PDP Pasal 56).
- Tenggat menjawab permintaan subjek data.
- Nama Pejabat Pelindungan Data Pribadi bila diwajibkan (Pasal 53).
