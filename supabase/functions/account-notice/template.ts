// Isi email pemberitahuan akun dalam Bahasa Indonesia.

export interface NoticeEmail {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export function renderAccountNotice(kind: string, fullName: string): NoticeEmail {
  if (kind !== 'account_locked') throw new Error(`Jenis pemberitahuan tidak dikenal: ${kind}`);
  const paragraphs = [
    `Halo ${fullName},`,
    'Akun Admin Indoor Map Anda dikunci selama 15 menit karena 5 kali percobaan masuk dengan password yang salah.',
    'Jika itu Anda, tunggu 15 menit lalu masuk lagi, atau pakai "Lupa password?" di halaman masuk.',
    'Jika bukan Anda, seseorang mungkin mencoba masuk ke akun Anda. Ganti password lewat "Lupa password?" setelah kunci berakhir dan beri tahu Super Admin.',
  ];
  return {
    subject: 'Akun Admin Indoor Map dikunci sementara',
    text: `${paragraphs.join('\n\n')}\n`,
    html: paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join(''),
  };
}
