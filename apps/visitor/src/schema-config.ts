import { z } from 'zod';

// Modul pertama yang dimuat main.tsx, sebelum @indoor/domain: aplikasi berjalan di bawah CSP tanpa
// 'unsafe-eval', dan zod mencoba Function('') untuk mengompilasi skema saat skema pertama dipakai.
// Percobaan itu gagal tetapi tercatat sebagai pelanggaran CSP; tanpa kompilasi validasinya sama.
z.config({ jitless: true });
