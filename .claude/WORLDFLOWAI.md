# Workflow AI (WorldFlowAI)

Agent, command, dan skill Claude Code untuk repo ini, diadaptasi dari [worldflowai/everything-claude-code](https://github.com/worldflowai/everything-claude-code) (commit `432485b`, fork dari [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), lisensi MIT, © Affaan Mustafa). Isinya ditulis ulang untuk stack dan aturan repo ini (pnpm, Turborepo, Biome, Vitest, pgTAP, Supabase) dan tunduk pada `CLAUDE.md`.

## Isi

| Jenis | Nama |
| --- | --- |
| Agent (`.claude/agents/`) | `planner`, `architect`, `tdd-guide`, `code-reviewer`, `security-reviewer`, `build-error-resolver`, `refactor-cleaner`, `e2e-runner` |
| Command (`.claude/commands/`) | `/ecc-plan`, `/ecc-tdd`, `/ecc-verify`, `/ecc-code-review`, `/ecc-security-review`, `/ecc-build-fix`, `/ecc-refactor-clean`, `/ecc-e2e` |
| Skill (`.claude/skills/`) | `ecc-tdd-workflow`, `ecc-security-checklist` |

Awalan `ecc-` mencegah bentrok dengan command bawaan Claude Code (`/code-review`, `/security-review`, `/review`).

## Alur untuk satu task

```
/ecc-plan T-xxx          rencana, tunggu persetujuan
/kerjakan-task T-xxx     kerjakan sesuai playbook (branch, PROGRESS.md, PR)
/ecc-tdd …               logika domain/routing/SQL dengan test lebih dulu
/ecc-verify pra-pr       check, build, test database, audit, tinjauan
```

Bila CI atau `pnpm check` merah: `/ecc-build-fix`. Untuk perubahan RLS, Storage, Edge Function, atau auth: `/ecc-security-review`.

## Yang sengaja tidak dibawa

- **Hook** repo asal: format otomatis dengan Prettier (repo ini memakai Biome), blokir `pnpm dev` di luar tmux, blokir file `.md` baru (playbook di `docs/` berupa Markdown), dan penyimpanan sesi ke `~/.claude/sessions`.
- **Rules** (`rules/*.md`): tumpang tindih dan sebagian bertentangan dengan `CLAUDE.md` (misalnya format commit `T-xxx: …`).
- Command yang bergantung pada hook atau stack lain: `/checkpoint`, `/learn`, `/eval`, `/orchestrate`, `/setup-pm`, `/test-coverage`, `/update-codemaps`, `/update-docs`.
- Skill untuk stack lain (ClickHouse, backend Node/Express) dan konfigurasi MCP.
- Dari `e2e-runner`: karantina test tidak stabil (`test.fixme`), project Firefox/WebKit, dan contoh skenario proyek asal (markets, wallet, trading). Pola lainnya dibawa: Page Object Model, fixture, artefak saat gagal, laporan HTML/JUnit, cek stabilitas `--repeat-each`, dan workflow CI dengan unggah artefak.

## Pembaruan dari upstream (2026-10-02)

Dibandingkan dengan `agents/` di WorldFlowAI/everything-claude-code: ditambahkan ke `security-reviewer` (OWASP Top 10 + CWE, CORS/CSRF, header, batas pemakaian, log dan pesan error aman, data di URL, audit riwayat git dan `pip-audit`, ringkasan risiko dan rekomendasi Blokir/Setuju), `code-reviewer` (ukuran fungsi dan sarang, sisa debug, TODO tanpa task, angka ajaib, N+1, bundle, kode tanpa test, contoh perbaikan), `build-error-resolver` (catatan kemajuan, diff minimal, daftar boleh/tidak, test Python). Bagian khusus keuangan/blockchain dan Next.js tidak diambil karena tidak relevan. `doc-updater` tidak diambil: dokumentasi diperbarui lewat `PROGRESS.md` dan file task.
