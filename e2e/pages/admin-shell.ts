import { expect, type Locator, type Page } from '@playwright/test';

/** Kerangka Admin: pemilih venue dan menu akun. */
export class AdminShell {
  readonly venuePicker: Locator;

  constructor(readonly page: Page) {
    this.venuePicker = page.getByRole('combobox', { name: 'Venue aktif' });
  }

  accountButton(name: string) {
    return this.page.getByRole('button', { name: new RegExp(name) });
  }

  async selectVenue(name: string) {
    await this.venuePicker.click();
    await this.page.getByRole('option', { name, exact: true }).click();
    await expect(this.venuePicker).toHaveText(name);
  }

  async signOut(name: string) {
    await this.accountButton(name).click();
    await this.page.getByRole('menuitem', { name: 'Keluar' }).click();
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
