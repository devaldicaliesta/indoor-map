# CA tambahan untuk build

Bila server klien keluar ke internet lewat proxy yang memeriksa HTTPS (CA perusahaan), salin
sertifikat CA itu ke folder ini dengan akhiran `.crt` (format PEM). Build image memakainya untuk
mengunduh dependensi. Tanpa proxy seperti itu, folder ini dibiarkan kosong.
