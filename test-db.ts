import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.$connect()
    console.log('✅ Conexão com o banco bem-sucedida!')
    
    const novels = await prisma.novels.findMany()
    console.log(`📚 Encontradas ${novels.length} novels no banco`)
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()