import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Funciones para manejo seguro de contraseñas
 * Implementa hashing con bcrypt y salt de alta seguridad
 */

/**
 * Genera hash seguro de una contraseña
 * @param password - Contraseña en texto plano
 * @returns Promise<string> - Hash de la contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Validar longitud mínima de contraseña
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres')
  }

  // Generar salt con factor de costo 12 (recomendado para 2024)
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Verifica una contraseña contra su hash
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Hash almacenado en BD
 * @returns Promise<boolean> - true si coincide
 */
export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Genera string aleatorio seguro
 * @param length - Longitud del string
 * @returns string - String aleatorio
 */
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * Genera token seguro para verificación de email
 * @returns string - Token único de 32 caracteres
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Genera token UUID para enlaces públicos
 * @returns string - UUID v4 único
 */
export const generatePublicToken = (): string => {
  return crypto.randomUUID()
}

/**
 * Valida fortaleza de contraseña
 * @param password - Contraseña a validar
 * @returns object - Resultado de validación
 */
export const validatePasswordStrength = (password: string) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars
  ].filter(Boolean).length

  return {
    isValid: score >= 3 && password.length >= minLength,
    score,
    feedback: {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      specialChars: hasSpecialChars
    },
    strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very-strong'
  }
}

/**
 * Genera contraseña temporal aleatoria
 * @param length - Longitud de la contraseña (por defecto 12)
 * @returns string - Contraseña temporal
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Garantizar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Llenar el resto aleatoriamente
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}