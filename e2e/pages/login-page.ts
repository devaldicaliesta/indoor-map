import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  /** Logo PanduArah di atas kartu masuk (dipakai juga lupa/reset password dan aktivasi). */
  readonly brand: Locator;

  constructor(readonly page: Page) {
    this.brand = page.getByRole('img', { name: 'PanduArah', exact: true });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Masuk' });
    this.error = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.submit).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
