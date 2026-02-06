require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setUserStudyTime() {
  const username = "oatmealrasin";
  const targetMinutes = 20;
  const targetSeconds = targetMinutes * 60;
  
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }
    
    const now = new Date();
    const nyDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const today = new Date(nyDate.getFullYear(), nyDate.getMonth(), nyDate.getDate());
    
    const dailyStat = await prisma.dailyStat.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        totalSeconds: targetSeconds,
      },
      create: {
        userId: user.id,
        date: today,
        totalSeconds: targetSeconds,
        isPublic: true,
      },
    });
    
    console.log(`Set ${username} to ${targetMinutes} minutes (${targetSeconds} seconds)`);
    console.log(`DailyStat ID: ${dailyStat.id}`);
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setUserStudyTime();
