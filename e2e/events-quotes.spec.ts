import { test, expect } from '@playwright/test'

test.describe('Event and Quote Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create event and generate quote', async ({ page }) => {
    // Navegar a la sección de eventos
    await page.click('text=Eventos')

    // Hacer click en "Nuevo Evento"
    await page.click('button:has-text("Nuevo Evento")')

    // Llenar formulario del evento
    await page.fill('input[name="title"]', 'Evento de Prueba E2E')
    await page.fill('input[name="startDate"]', '2024-12-01T10:00')
    await page.fill('input[name="endDate"]', '2024-12-01T18:00')

    // Seleccionar cliente
    await page.click('text=Seleccionar Cliente')
    await page.click('text=Juan Pérez') // Cliente de prueba

    // Guardar evento
    await page.click('button[type="submit"]:has-text("Guardar")')

    // Verificar que el evento se creó
    await expect(page.locator('text=Evento de Prueba E2E')).toBeVisible()

    // Navegar a cotizaciones del evento
    await page.click('text=Generar Cotización')

    // Verificar que se abrió el modal de cotización
    await expect(page.locator('text=Crear Cotización')).toBeVisible()

    // Agregar items a la cotización
    await page.click('button:has-text("Agregar Item")')
    await page.fill('input[name="itemName"]', 'Servicio de Catering')
    await page.fill('input[name="quantity"]', '50')
    await page.fill('input[name="unitPrice"]', '100')

    // Guardar cotización
    await page.click('button[type="submit"]:has-text("Crear Cotización")')

    // Verificar que la cotización se creó
    await expect(page.locator('text=Cotización creada exitosamente')).toBeVisible()
  })

  test('should send quote via email', async ({ page }) => {
    // Navegar a cotizaciones
    await page.click('text=Cotizaciones')

    // Seleccionar una cotización existente
    await page.click('tr:first-child') // Primera fila de la tabla

    // Hacer click en "Enviar por Email"
    await page.click('button:has-text("Enviar por Email")')

    // Llenar destinatario
    await page.fill('input[name="recipientEmail"]', 'cliente@example.com')

    // Enviar
    await page.click('button[type="submit"]:has-text("Enviar")')

    // Verificar confirmación
    await expect(page.locator('text=Email enviado exitosamente')).toBeVisible()
  })

  test('should generate and download PDF', async ({ page }) => {
    // Navegar a una cotización
    await page.click('text=Cotizaciones')
    await page.click('tr:first-child')

    // Hacer click en "Descargar PDF"
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Descargar PDF")')
    const download = await downloadPromise

    // Verificar que se descargó un archivo PDF
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })
})