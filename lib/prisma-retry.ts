import { PrismaClient } from '@prisma/client';

/**
 * Executa uma operação Prisma com retry automático
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é um erro de conexão
      const isConnectionError = 
        error.message?.includes("Can't reach database server") ||
        error.message?.includes("Connection timeout") ||
        error.message?.includes("Connection refused") ||
        error.code === 'P1001' || // Connection timeout
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017';   // Server has closed the connection
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      // Log do retry (só em desenvolvimento)
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`🔄 Retry ${attempt}/${maxRetries} - Erro de conexão:`, error.message);
      }

      // Esperar antes do próximo retry com backoff exponencial
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrapper para operações Prisma com retry automático
 */
export class PrismaRetryClient {
  constructor(private prisma: PrismaClient) {}

  /**
   * Executa findUnique com retry
   */
  async findUnique<T>(model: string, args: any): Promise<T> {
    return withRetry(() => (this.prisma as any)[model].findUnique(args));
  }

  /**
   * Executa findMany com retry
   */
  async findMany<T>(model: string, args: any): Promise<T> {
    return withRetry(() => (this.prisma as any)[model].findMany(args));
  }

  /**
   * Executa update com retry
   */
  async update<T>(model: string, args: any): Promise<T> {
    return withRetry(() => (this.prisma as any)[model].update(args));
  }

  /**
   * Executa updateMany com retry
   */
  async updateMany<T>(model: string, args: any): Promise<T> {
    return withRetry(() => (this.prisma as any)[model].updateMany(args));
  }

  /**
   * Executa create com retry
   */
  async create<T>(model: string, args: any): Promise<T> {
    return withRetry(() => (this.prisma as any)[model].create(args));
  }

  /**
   * Executa count com retry
   */
  async count<T>(model: string, args: any): Promise<T> {
    return withRetry(() => (this.prisma as any)[model].count(args));
  }

  /**
   * Executa operação personalizada com retry
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return withRetry(operation);
  }
}