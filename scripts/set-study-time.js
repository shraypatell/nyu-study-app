// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setUserStudyTime() {
  const username = "oatmealrasin";
  const targetHours = 6;
  const targetSeconds = targetHours * 60 * 60;
  
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      console.error(`❌ User ${username} not found`);
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${user.username} (${user.id})`);
    
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
    
    console.log(`\n✅ SUCCESS!`);
    console.log(`   User: ${username}`);
    console.log(`   Study time: ${targetHours} hours (${targetSeconds} seconds)`);
    console.log(`   Date: ${today.toDateString()}`);
    console.log(`   DailyStat ID: ${dailyStat.id}`);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setUserStudyTime();
