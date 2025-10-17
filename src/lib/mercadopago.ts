import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env["MERCADOPAGO_ACCESS_TOKEN"] as string,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
})

// Instancias de las APIs
export const mercadoPagoPayment = new Payment(client)
export const mercadoPagoPreference = new Preference(client)

export default client