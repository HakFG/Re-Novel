import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida no .env')
  }
  
  // Usando o construtor de forma explícita
  const client = new PrismaClient()
  
  // Forçando a URL (para Prisma 7)
  ;(client as any).$connect = client.$connect.bind(client)
  
  return client
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma