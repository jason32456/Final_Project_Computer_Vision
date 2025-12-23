const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const env = require('dotenv');

env.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

console.log("DATABASE_URL =", process.env.DATABASE_URL);
console.log("TYPE =", typeof process.env.DATABASE_URL);


const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;