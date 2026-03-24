import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { parse } from 'pg-connection-string'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Use pg-connection-string to parse the URL correctly —
  // Node's built-in URL parser drops the project ref from Supabase
  // usernames like "postgres.projectref"
  const config = parse(process.env.DATABASE_URL || '')
  const pool = new Pool({ ...config, ssl: { rejectUnauthorized: false } })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
