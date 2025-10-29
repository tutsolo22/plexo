import { Page } from '@playwright/test'

/**
 * Utilidades para tests E2E
 * Sistema de Gestión de Eventos V3
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Realiza login con credenciales de prueba
   */
  async login(email = 'admin@example.com', password = 'admin123') {
    await this.page.goto('/auth/signin')
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')
    await this.page.waitForURL('/dashboard')
  }

  /**
   * Crea un evento de prueba
   */
  async createTestEvent(eventData: {
    title: string
    startDate: string
    endDate: string
    clientName?: string
  }) {
    await this.page.click('text=Eventos')
    await this.page.click('button:has-text("Nuevo Evento")')

    await this.page.fill('input[name="title"]', eventData.title)
    await this.page.fill('input[name="startDate"]', eventData.startDate)
    await this.page.fill('input[name="endDate"]', eventData.endDate)

    if (eventData.clientName) {
      await this.page.click('text=Seleccionar Cliente')
      await this.page.click(`text=${eventData.clientName}`)
    }

    await this.page.click('button[type="submit"]:has-text("Guardar")')
    await this.page.waitForSelector(`text=${eventData.title}`)
  }

  /**
   * Crea una cotización para un evento
   */
  async createTestQuote(eventTitle: string, items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>) {
    // Navegar al evento
    await this.page.click(`text=${eventTitle}`)
    await this.page.click('text=Generar Cotización')

    // Agregar items
    for (const item of items) {
      await this.page.click('button:has-text("Agregar Item")')
      await this.page.fill('input[name="itemName"]', item.name)
      await this.page.fill('input[name="quantity"]', item.quantity.toString())
      await this.page.fill('input[name="unitPrice"]', item.unitPrice.toString())
    }

    await this.page.click('button[type="submit"]:has-text("Crear Cotización")')
    await this.page.waitForSelector('text=Cotización creada exitosamente')
  }

  /**
   * Envía una cotización por email
   */
  async sendQuoteByEmail(quoteTitle: string, recipientEmail: string) {
    await this.page.click('text=Cotizaciones')
    await this.page.click(`text=${quoteTitle}`)
    await this.page.click('button:has-text("Enviar por Email")')

    await this.page.fill('input[name="recipientEmail"]', recipientEmail)
    await this.page.click('button[type="submit"]:has-text("Enviar")')

    await this.page.waitForSelector('text=Email enviado exitosamente')
  }

  /**
   * Descarga PDF de una cotización
   */
  async downloadQuotePDF(quoteTitle: string) {
    await this.page.click('text=Cotizaciones')
    await this.page.click(`text=${quoteTitle}`)

    const downloadPromise = this.page.waitForEvent('download')
    await this.page.click('button:has-text("Descargar PDF")')
    const download = await downloadPromise

    return download
  }

  /**
   * Espera a que se complete una operación asíncrona
   */
  async waitForLoading() {
    await this.page.waitForSelector('.loading', { state: 'hidden' })
  }

  /**
   * Toma una captura de pantalla para debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` })
  }

  /**
   * Verifica que un elemento esté visible y contenga texto
   */
  async expectTextVisible(text: string) {
    await this.page.waitForSelector(`text=${text}`)
  }

  /**
   * Navega a una sección del dashboard
   */
  async navigateToSection(sectionName: string) {
    await this.page.click(`text=${sectionName}`)
    await this.waitForLoading()
  }
}

/**
 * Datos de prueba comunes
 */
export const testData = {
  users: {
    admin: { email: 'admin@example.com', password: 'admin123' },
    user: { email: 'user@example.com', password: 'user123' }
  },
  events: {
    corporate: {
      title: 'Evento Corporativo E2E',
      startDate: '2024-12-15T09:00',
      endDate: '2024-12-15T17:00',
      clientName: 'Empresa ABC'
    },
    wedding: {
      title: 'Boda E2E',
      startDate: '2024-12-20T16:00',
      endDate: '2024-12-20T23:00',
      clientName: 'María González'
    }
  },
  quotes: {
    basic: [
      { name: 'Servicio de Catering', quantity: 50, unitPrice: 150 },
      { name: 'Decoración', quantity: 1, unitPrice: 2000 }
    ],
    premium: [
      { name: 'Servicio de Catering Premium', quantity: 100, unitPrice: 250 },
      { name: 'Música DJ', quantity: 1, unitPrice: 3000 },
      { name: 'Fotografía Profesional', quantity: 1, unitPrice: 5000 }
    ]
  }
}