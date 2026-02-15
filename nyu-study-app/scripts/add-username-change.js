require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addUsernameChange() {
  const username = "developer";
  
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }
    
    const currentChanges = user.usernameChanges || 0;
    const newChanges = Math.max(0, currentChanges - 1);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { usernameChanges: newChanges },
    });
    
    console.log(`✅ Added 1 username change to ${username}`);
    console.log(`Previous changes used: ${currentChanges}`);
    console.log(`Remaining changes: ${2 - newChanges}`);
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addUsernameChange();
