// Script para inicializar el tema sin flash
const initTheme = () => {
  const theme = localStorage.getItem('theme') || 'light'
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Ejecutar inmediatamente
initTheme()