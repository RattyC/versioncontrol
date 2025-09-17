
# Playwright E2E Testing + CI/CD Guide (Quasar SPA + GitHub Pages)

> สำหรับโปรเจกต์ที่มี **แอปอยู่ในโฟลเดอร์ `VersionControl1/`** และ **การทดสอบด้วย Playwright อยู่ในโฟลเดอร์ `Playwright/`**  
> เอกสารนี้แยกเป็น 2 ส่วน: (1) การทำ E2E Test จากลิงก์ที่ deploy แล้ว และ (2) การทำ CI/CD รวมการทดสอบอัตโนมัติ

---

## สารบัญ
- [ภาพรวม](#ภาพรวม)
- [สิ่งที่ต้องมี (Prerequisites)](#สิ่งที่ต้องมี-prerequisites)
- [ส่วนที่ 1: จัดทำการทดสอบจากลิงก์ที่ Deploy แล้ว](#ส่วนที่-1-จัดทำการทดสอบจากลิงก์ที่-deploy-แล้ว)
  - [1.1 โครงสร้างโฟลเดอร์สำหรับการทดสอบ](#11-โครงสร้างโฟลเดอร์สำหรับการทดสอบ)
  - [1.2 ติดตั้ง Playwright เฉพาะในโฟลเดอร์ `Playwright/`](#12-ติดตั้ง-playwright-เฉพาะในโฟลเดอร์-playwright)
  - [1.3 ตั้งค่า `playwright.config.ts` (ชี้ไปยังลิงก์ที่ deploy)](#13-ตั้งค่า-playwrightconfigts-ชี้ไปยังลิงก์ที่-deploy)
  - [1.4 เขียน test แรกสำหรับฟอร์ม Quasar](#14-เขียน-test-แรกสำหรับฟอร์ม-quasar)
  - [1.5 รันทดสอบในเครื่อง](#15-รันทดสอบในเครื่อง)
  - [1.6 เคล็ดลับ/แก้ปัญหาการเลือก element ของ Quasar](#16-เคล็ดลับแก้ปัญหาการเลือก-element-ของ-quasar)
- [ส่วนที่ 2: CI/CD (Build + Test + Deploy) ด้วย GitHub Actions](#ส่วนที่-2-cicd-build--test--deploy-ด้วย-github-actions)
  - [2.1 โครงสร้างโปรเจกต์](#21-โครงสร้างโปรเจกต์)
  - [2.2 ไฟล์ Workflow (แยก **test** และ **build-and-deploy**)](#22-ไฟล์-workflow-แยก-test-และ-build-and-deploy)
  - [2.3 การตั้งค่า Secret สำหรับ Deploy](#23-การตั้งค่า-secret-สำหรับ-deploy)
  - [2.4 รายงานผลการทดสอบ (Artifacts/Report)](#24-รายงานผลการทดสอบ-artifactsreport)
  - [2.5 จุดที่พบบ่อยและวิธีแก้](#25-จุดที่พบบ่อยและวิธีแก้)
- [ภาคผนวก A: ใช้ `webServer` ใน `playwright.config.ts` เพื่อ start server อัตโนมัติ](#ภาคผนวก-a-ใช้-webserver-ใน-playwrightconfigts-เพื่อ-start-server-อัตโนมัติ)
- [ภาคผนวก B: Component Testing (ทางเลือก)](#ภาคผนวก-b-component-testing-ทางเลือก)
- [ภาคผนวก C: ตั้งค่า `publicPath` ของ Quasar สำหรับ GitHub Pages](#ภาคผนวก-c-ตั้งค่า-publicpath-ของ-quasar-สำหรับ-github-pages)
- [ภาคผนวก D: ตัวอย่างสคริปต์ใน `package.json` (ฝั่ง Playwright)](#ภาคผนวก-d-ตัวอย่างสคริปต์ใน-packagejson-ฝั่ง-playwright)

---

## ภาพรวม
- เราจะทำ **E2E Test** ด้วย Playwright กับหน้าเว็บที่ deploy แล้ว (เช่น `https://somnuk2.github.io/VersionControl1/`)  
- ใน CI/CD: เมื่อ push เข้าสาขา `master` → **ทดสอบอัตโนมัติ** → ถ้าผ่านค่อย **Build & Deploy** ไป GitHub Pages  
- แยกโฟลเดอร์ชัดเจน: แอป (`VersionControl1/`) และ เทสท์ (`Playwright/`)

## สิ่งที่ต้องมี (Prerequisites)
- Node.js 18+ (แนะนำ 20)
- Repo GitHub ที่เปิดใช้ GitHub Actions
- ถ้าจะใช้ `peaceiris/actions-gh-pages`: ตั้งค่า Secret สำหรับ token (ดูหัวข้อ [2.3](#23-การตั้งค่า-secret-สำหรับ-deploy))

> ⚠️ **ความปลอดภัย**: หากเคย commit token ลงไฟล์ ให้ **รีเซ็ต/เพิกถอน (revoke)** token นั้นทันที แล้วสร้างใหม่เป็น Secret เสมอ

---

## ส่วนที่ 1: จัดทำการทดสอบจากลิงก์ที่ Deploy แล้ว

### 1.1 โครงสร้างโฟลเดอร์สำหรับการทดสอบ
```
.
├── VersionControl1/            # แอป Quasar
│   ├── package.json
│   └── ...
└── Playwright/                 # โฟลเดอร์สำหรับการทดสอบ
    ├── package.json
    ├── playwright.config.ts
    └── tests/
        └── form.spec.ts
```

> แยก `package.json` ของ Playwright ออกจากแอป เพื่อให้ติดตั้ง dependency เฉพาะที่จำเป็นสำหรับการทดสอบ

### 1.2 ติดตั้ง Playwright เฉพาะในโฟลเดอร์ `Playwright/`
```bash
cd Playwright
npm init -y
npm i -D @playwright/test
npx playwright install --with-deps
```

**ตัวอย่าง `Playwright/package.json` แบบสั้น:**
```json
{
  "name": "playwright-tests",
  "private": true,
  "devDependencies": {
    "@playwright/test": "^1.47.0"
  },
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "show-report": "playwright show-report"
  }
}
```

### 1.3 ตั้งค่า `playwright.config.ts` (ชี้ไปยังลิงก์ที่ deploy)
สร้างไฟล์ `Playwright/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  retries: 1,
  use: {
    headless: true,
    baseURL: process.env.BASE_URL || 'https://somnuk2.github.io/VersionControl1/', // ← เปลี่ยนตามลิงก์ของคุณ
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox',  use: { browserName: 'firefox'  } },
    { name: 'webkit',   use: { browserName: 'webkit'   } },
  ],
});
```

> เคล็ดลับ: ตั้ง `BASE_URL` ผ่าน environment variable ได้ใน CI เช่น `BASE_URL=https://... npx playwright test`

### 1.4 เขียน test แรกสำหรับฟอร์ม Quasar
ไฟล์: `Playwright/tests/form.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test.describe('Quasar Form - E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // baseURL ถูกตั้งไว้ใน config แล้ว
  });

  test('แจ้งเตือนเมื่อยังไม่ยอมรับเงื่อนไข', async ({ page }) => {
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('.q-notification')).toContainText(
      'You need to accept the license and terms first'
    );
  });

  test('แสดงข้อความ validate เมื่อกรอกไม่ถูกต้อง', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Your name *' }).fill(''); // ชื่อว่าง
    await page.getByRole('spinbutton', { name: 'Your age *' }).fill('-5'); // อายุผิดเงื่อนไข
    await page.getByRole('checkbox', { name: 'I accept the license and terms' }).check();
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Please type something')).toBeVisible();
    await expect(page.getByText('Please type a real age')).toBeVisible();
  });

  test('ส่งฟอร์มสำเร็จเมื่อข้อมูลถูกต้องครบถ้วน', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Your name *' }).fill('Somnuk Sin');
    await page.getByRole('spinbutton', { name: 'Your age *' }).fill('30');
    await page.getByRole('checkbox', { name: 'I accept the license and terms' }).check();
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.locator('.q-notification')).toContainText('Submitted');
  });

  test('ปุ่ม Reset ล้างค่าทุกฟิลด์', async ({ page }) => {
    const name = page.getByRole('textbox', { name: 'Your name *' });
    const age  = page.getByRole('spinbutton', { name: 'Your age *' });
    const accept = page.getByRole('checkbox', { name: 'I accept the license and terms' });

    await name.fill('Alice');
    await age.fill('25');
    await accept.check();

    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(name).toHaveValue('');
    await expect(age).toHaveValue('');
    await expect(accept).not.toBeChecked();
  });
});
```

> ถ้า selector ด้านบนหา element ไม่เจอในบางธีมของ Quasar ให้ดูหัวข้อ [1.6](#16-เคล็ดลับแก้ปัญหาการเลือก-element-ของ-quasar) สำหรับเทคนิคเลือก element แบบเสถียร

### 1.5 รันทดสอบในเครื่อง
```bash
cd Playwright
# ใช้ BASE_URL จากลิงก์ที่ deploy แล้ว
BASE_URL="https://somnuk2.github.io/VersionControl1/" npm run test
# หรือเปิด browser ให้เห็น
BASE_URL="https://somnuk2.github.io/VersionControl1/" npm run test:headed
npm run show-report
```

### 1.6 เคล็ดลับ/แก้ปัญหาการเลือก element ของ Quasar
- ใช้ **Role-based selectors** ของ Playwright: `getByRole('button', { name: 'Submit' })`
- ใช้ **Accessible name** จาก `label`, `aria-label`, `for`/`id` ช่วยให้ selector เสถียร
- ถ้าเป็นไปได้ ให้เพิ่ม `data-testid` ลงใน component เพื่อให้เลือกชัดเจน เช่น  
  ```vue
  <q-input data-testid="input-name" ... />
  <q-input data-testid="input-age" ... />
  <q-toggle data-testid="toggle-accept" ... />
  <q-btn data-testid="btn-submit" ... />
  <q-btn data-testid="btn-reset" ... />
  ```
  แล้วในเทสท์:
  ```ts
  page.getByTestId('input-name').fill('Somnuk Sin');
  ```
- การแจ้งเตือนของ Quasar มักอยู่ใน `.q-notification` → ใช้ `locator('.q-notification')` ตรวจข้อความ

---

## ส่วนที่ 2: CI/CD (Build + Test + Deploy) ด้วย GitHub Actions

### 2.1 โครงสร้างโปรเจกต์
```
.
├── VersionControl1/                 # แอป Quasar
│   ├── package.json
│   └── ...
├── Playwright/                      # โค้ดทดสอบ
│   ├── package.json
│   ├── playwright.config.ts
│   └── tests/
│       └── form.spec.ts
└── .github/
    └── workflows/
        └── ci.yml                   # ไฟล์ workflow
```

### 2.2 ไฟล์ Workflow (แยก **test** และ **build-and-deploy**)
สร้างไฟล์ `.github/workflows/ci.yml`:
```yaml
name: CI/CD Quasar + Playwright

on:
  push:
    branches: [ "master" ]  # เปลี่ยนตาม branch ที่ใช้

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # --- Build Quasar (สำหรับทดสอบบน local server หรือสำหรับบางกรณี) ---
      - name: Install app dependencies
        working-directory: ./VersionControl1
        run: npm install

      - name: Build Quasar SPA
        working-directory: ./VersionControl1
        run: npx quasar build

      # --- Setup Playwright ---
      - name: Install test dependencies
        working-directory: ./Playwright
        run: npm install

      - name: Install Playwright browsers
        working-directory: ./Playwright
        run: npx playwright install --with-deps

      # --- รันเทสท์กับ URL ที่ deploy แล้ว (ตั้ง BASE_URL) ---
      - name: Run Playwright tests (against deployed URL)
        working-directory: ./Playwright
        env:
          BASE_URL: https://somnuk2.github.io/VersionControl1/
        run: npx playwright test --reporter=line

      # เก็บรายงานผลเทสท์
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: Playwright/playwright-report
          retention-days: 7

  build-and-deploy:
    needs: test   # ✅ deploy เฉพาะเมื่อ test ผ่าน
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install app dependencies
        working-directory: ./VersionControl1
        run: npm install

      - name: Build Quasar SPA
        working-directory: ./VersionControl1
        run: npx quasar build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GH_PAT }}   # หรือใช้ GITHUB_TOKEN ถ้ารองรับ
          publish_dir: VersionControl1/dist/spa
```

> ทางเลือก: จะทดสอบบน **local server** แทนการยิงไปยัง URL ที่ deploy แล้วก็ได้  
> - เพิ่ม step: `npx http-server VersionControl1/dist/spa -p 4173 -s &`  
> - ตั้ง `BASE_URL=http://localhost:4173` แล้วรันเทสท์

### 2.3 การตั้งค่า Secret สำหรับ Deploy
- ไปที่ **Settings → Secrets and variables → Actions → New repository secret**  
- สร้าง secret ชื่อ `GH_PAT` (หรือใช้ built-in `GITHUB_TOKEN` ตาม action ที่ใช้/ความต้องการของ repo)  
- ให้สิทธิ์ token เท่าที่จำเป็น (public repo ใช้ `GITHUB_TOKEN` ได้ในหลายกรณี)  
- ตั้งค่า GitHub Pages ให้ใช้ branch `gh-pages` (หรือค่าตาม action) ตามที่ `peaceiris/actions-gh-pages` สร้าง

> ⚠️ **หากเคยเปิดเผย token ในไฟล์** ให้รีบ **revoke** แล้วออก token ใหม่ทันที

### 2.4 รายงานผลการทดสอบ (Artifacts/Report)
- หลัง workflow รันจบ แม้เทสท์ล้มเหลว เราตั้ง `if: always()` กับ upload artifact ไว้แล้ว  
- ไปที่หน้า Actions → เลือก run → ดาวน์โหลด `playwright-report` เพื่อดูรายงาน

### 2.5 จุดที่พบบ่อยและวิธีแก้
- **Selector หายากใน Quasar** → ใช้ role-based selector หรือเพิ่ม `data-testid`
- **BASE_URL ไม่ตรง** → ตรวจสอบ `baseURL` ใน `playwright.config.ts` หรือ env `BASE_URL`
- **Deploy แล้ว asset 404 บน GitHub Pages** → ดู [ภาคผนวก C](#ภาคผนวก-c-ตั้งค่า-publicpath-ของ-quasar-สำหรับ-github-pages)
- **Token ไม่ถูกต้อง/สิทธิ์ไม่พอ** → ตรวจ Secret, สิทธิ์, และ branch target
- **Build นาน/เครื่องช้า** → ใช้ Node.js LTS, cache (สามารถเพิ่ม actions/cache)

---

## ภาคผนวก A: ใช้ `webServer` ใน `playwright.config.ts` เพื่อ start server อัตโนมัติ
ถ้าอยากให้ Playwright **สตาร์ท local server เอง** ก่อนเทสท์ (เหมาะกับการทดสอบ build ที่อยู่คนละโฟลเดอร์):

`Playwright/playwright.config.ts` (ตัวอย่างใช้ `http-server`):
```ts
import { defineConfig } from '@playwright/test';
import path from 'path';

const dist = path.resolve(__dirname, '../VersionControl1/dist/spa');

export default defineConfig({
  testDir: './tests',
  use: {
    headless: true,
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
  },
  webServer: process.env.BASE_URL
    ? undefined // ถ้าใช้ URL ที่ deploy แล้ว ไม่ต้องเปิด server
    : {
        command: `npx http-server "${dist}" -p 4173 -s`,
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
```
> ใน CI: ให้ build แอปก่อน (`npx quasar build`) แล้ว Playwright จะ start server ให้เองเมื่อไม่ได้ตั้ง `BASE_URL`

## ภาคผนวก B: Component Testing (ทางเลือก)
ถ้าต้องการเทสท์ระดับ component (ไม่ต้องโหลดทั้งเว็บ):
- ใช้ `@playwright/experimental-ct-vue`
- Mount component แล้วทดสอบ logic ของฟอร์มโดยตรง
- เหมาะกับการเทสท์ที่ไม่ผูกกับ routing/asset ของ production

## ภาคผนวก C: ตั้งค่า `publicPath` ของ Quasar สำหรับ GitHub Pages
ถ้า repo ชื่อ `VersionControl1` และ deploy ที่ `https://<user>.github.io/VersionControl1/`  
ให้ตั้งค่า `publicPath` เพื่อให้ asset ชี้ path ถูกต้อง (ตัวอย่างใน `quasar.conf.js` หรือ `quasar.config.*` รุ่นใหม่):
```js
// quasar.config.*
build: {
  publicPath: '/VersionControl1/'
}
```
> ถ้าไม่ตั้ง บางครั้ง asset จะชี้ที่ root (`/`) ทำให้ 404 เมื่อเปิดผ่าน GitHub Pages

## ภาคผนวก D: ตัวอย่างสคริปต์ใน `package.json` (ฝั่ง Playwright)
`Playwright/package.json`:
```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "show-report": "playwright show-report",
    "test:live": "BASE_URL=https://somnuk2.github.io/VersionControl1/ playwright test",
    "test:local": "BASE_URL= http-server ../VersionControl1/dist/spa -p 4173 -s & playwright test"
  }
}
```

> สคริปต์ `test:live` จะรันเทสท์กับ URL ที่ deploy แล้ว  
> ส่วน `test:local` เป็นตัวอย่าง start server แบบ manual + รันเทสท์บน localhost

---

**จบเอกสาร** — ถ้าต้องการตัวอย่างเทสท์/คอนฟิกเพิ่มเติมสำหรับกรณีเฉพาะ (เช่น auth, API mocking, การอัปโหลดไฟล์ ฯลฯ) สามารถต่อยอดจากไฟล์นี้ได้เลย
