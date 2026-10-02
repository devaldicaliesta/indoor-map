import { expect, type Page } from '@playwright/test';
import { AdminShell } from '../pages/admin-shell';
import { EditorPage } from '../pages/editor-page';

/** Panel "Uji rute" di Editor Peta Admin. */
export class TestRoutePanel {
  readonly panel;
  readonly steps;
  readonly summary;

  constructor(readonly page: Page) {
    this.panel = page.getByRole('region', { name: 'Uji rute' });
    this.steps = this.panel.getByRole('list', { name: 'Langkah' }).getByRole('listitem');
    this.summary = this.panel.getByText(/^\d[\d.,]* m · \d+ langkah/);
  }

  /** Masuk sebagai role itu, pilih venue, buka Editor Peta tab Uji rute. */
  async open(loginAs: (role: 'editor') => Promise<void>, venueName: string) {
    await loginAs('editor');
    await new AdminShell(this.page).selectVenue(venueName);
    const editor = new EditorPage(this.page);
    await editor.goto();
    await this.page.getByRole('tab', { name: 'Uji rute' }).click();
    await expect(this.panel).toBeVisible();
  }

  async pick(end: 'Dari' | 'Ke', query: string, option: RegExp | string = query) {
    const clear = this.panel.getByRole('button', { name: `Lepas ${end.toLowerCase()}` });
    if (await clear.isVisible()) await clear.click();
    const input = this.panel.getByRole('combobox', { name: end });
    await input.fill(query);
    await this.page
      .getByRole('listbox', { name: `Saran ${end.toLowerCase()}` })
      .getByRole('option', { name: option })
      .first()
      .click();
  }

  async route(from: string, to: string) {
    await this.pick('Dari', from);
    await this.pick('Ke', to);
    await expect(this.summary.or(this.panel.getByRole('alert'))).toBeVisible();
  }

  async accessible(on: boolean) {
    await this.panel.getByRole('checkbox', { name: 'Mode kursi roda' }).setChecked(on);
  }

  /** Jarak (m) dari ringkasan "123 m · 8 langkah". */
  async distance(): Promise<number> {
    const text = (await this.summary.textContent()) ?? '';
    return Number((text.split(' m')[0] ?? '').replace(/\./g, '').replace(',', '.'));
  }

  async stepTexts(): Promise<string[]> {
    return this.steps.allTextContents();
  }
}
