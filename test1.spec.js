const { test, expect } = require('@playwright/test');

test.describe('SauceDemo E-commerce Tests', () => {
  // Fixture สำหรับข้อมูลผู้ใช้
  const user = {
    standard: { username: 'standard_user', password: 'secret_sauce1' },
    lockedOut: { username: 'locked_out_user', password: 'secret_sauce' }
  };

  // Hook ก่อนการทดสอบแต่ละเคส
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
  });

  // Hook หลังการทดสอบแต่ละเคส (ถ้าต้องการ cleanup)
  test.afterEach(async ({ page }) => {
    await page.close();
  });

  // กลุ่มการทดสอบสำหรับการล็อกอิน
  test.describe('Login Functionality', () => {
    test('should login successfully with standard user', async ({ page }) => {
      await page.locator('#user-name').fill(user.standard.username);
      await page.locator('#password').fill(user.standard.password);
      await page.locator('#login-button').click();

      // ตรวจสอบว่าล็อกอินสำเร็จโดยดู URL หรือ element บนหน้า inventory
      await expect(page).toHaveURL(/inventory.html/);
      await expect(page.locator('.inventory_list')).toBeVisible();
    });
  });

});