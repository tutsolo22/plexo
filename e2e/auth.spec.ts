import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    // Navegar a la página de login
    await page.goto('/auth/signin')

    // Verificar que estamos en la página correcta
    await expect(page).toHaveTitle(/Iniciar Sesión/)

    // Llenar formulario de login
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')

    // Hacer click en el botón de login
    await page.click('button[type="submit"]')

    // Verificar redirección al dashboard
    await expect(page).toHaveURL('/dashboard')

    // Verificar que aparezca el contenido del dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')

    // Intentar login con credenciales inválidas
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Verificar mensaje de error
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible()
  })
})