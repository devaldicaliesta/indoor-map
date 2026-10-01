/** Pesan di panel/sheet: judul + kalimat langkah berikutnya, tanpa ilustrasi. */
export function PanelMessage({ title, description }: { title: string; description: string }) {
  return (
    <section className="grid gap-1">
      <h2 className="font-bold">{title}</h2>
      <p className="text-ink-muted">{description}</p>
    </section>
  );
}
