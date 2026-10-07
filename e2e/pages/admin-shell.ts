import { expect, type Locator, type Page } from '@playwright/test';

/** Kerangka Admin: logo dan menu di sidebar, pemilih venue, dan menu akun. */
export class AdminShell {
  readonly venuePicker: Locator;
  readonly sidebar: Locator;
  /** Logo PanduArah lengkap (simbol + tulisan) saat sidebar lebar. */
  readonly brandLogo: Locator;
  /** Simbol PanduArah saja saat sidebar diciutkan. */
  readonly brandSymbol: Locator;

  constructor(readonly page: Page) {
    this.venuePicker = page.getByRole('combobox', { name: 'Venue aktif' });
    this.sidebar = page.locator('aside[data-collapsed]');
    this.brandLogo = this.sidebar.locator('svg[data-brand="logo"]');
    this.brandSymbol = this.sidebar.locator('svg[data-brand="symbol"]');
  }

  accountButton(name: string) {
    return this.page.getByRole('button', { name: new RegExp(name) });
  }

  async selectVenue(name: string) {
    await this.venuePicker.click();
    await this.page.getByRole('option', { name, exact: true }).click();
    await expect(this.venuePicker).toHaveText(name);
  }

  async setSidebarCollapsed(collapsed: boolean) {
    const name = collapsed ? 'Ciutkan menu' : 'Lebarkan menu';
    const toggle = this.page.getByRole('button', { name });
    if (await toggle.isVisible()) await toggle.click();
    await expect(this.sidebar).toHaveAttribute('data-collapsed', String(collapsed));
  }

  async signOut(name: string) {
    await this.accountButton(name).click();
    await this.page.getByRole('menuitem', { name: 'Keluar' }).click();
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
