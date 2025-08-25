// utils/cleanup.ts
export async function cleanupExpiredContent() {
  try {
    const response = await fetch('/api/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (error) {
    }
}

// Função para executar limpeza a cada 6 horas
export function scheduleCleanup() {
  if (typeof window !== 'undefined') {
    setInterval(() => {
      cleanupExpiredContent();
    }, 6 * 60 * 60 * 1000); // 6 horas em milissegundos
  }
}

