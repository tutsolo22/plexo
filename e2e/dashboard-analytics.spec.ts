import { test, expect } from '@playwright/test'

test.describe('Dashboard and Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display dashboard with key metrics', async ({ page }) => {
    // Verificar elementos principales del dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Total de Eventos')).toBeVisible()
    await expect(page.locator('text=Total de Cotizaciones')).toBeVisible()
    await expect(page.locator('text=Ingresos Totales')).toBeVisible()
  })

  test('should navigate through different time periods', async ({ page }) => {
    // Verificar selector de período
    await expect(page.locator('select[name="period"]')).toBeVisible()

    // Cambiar a período de 30 días
    await page.selectOption('select[name="period"]', '30d')

    // Verificar que los datos se actualizan
    await expect(page.locator('.metric-card')).toHaveCount(4)
  })

  test('should display charts correctly', async ({ page }) => {
    // Verificar que los gráficos se renderizan
    await expect(page.locator('.recharts-wrapper')).toBeVisible()

    // Verificar gráfico de eventos por mes
    await expect(page.locator('text=Eventos por Mes')).toBeVisible()

    // Verificar gráfico de ingresos
    await expect(page.locator('text=Ingresos por Mes')).toBeVisible()
  })

  test('should filter data by status', async ({ page }) => {
    // Hacer click en filtro de cotizaciones
    await page.click('button:has-text("Todas las Cotizaciones")')

    // Seleccionar filtro "Aprobadas"
    await page.click('text=Aprobadas')

    // Verificar que se aplicó el filtro
    await expect(page.locator('.status-badge').first()).toHaveText('Aprobada')
  })

  test('should export analytics data', async ({ page }) => {
    // Hacer click en botón de exportar
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar Datos")')
    const download = await downloadPromise

    // Verificar descarga de archivo CSV o Excel
    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/)
  })

  test('should handle real-time notifications', async ({ page }) => {
    // Verificar que el sistema de notificaciones está presente
    await expect(page.locator('.notification-bell')).toBeVisible()

    // Simular recepción de notificación (esto requeriría configuración adicional)
    // await page.evaluate(() => {
    //   window.postMessage({ type: 'NEW_NOTIFICATION', payload: { ... } }, '*')
    // })

    // Verificar que aparece la notificación
    // await expect(page.locator('.notification-toast')).toBeVisible()
  })
})