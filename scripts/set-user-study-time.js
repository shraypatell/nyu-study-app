const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setUserStudyTime() {
  const username = "oatmealrasin";
  const targetHours = 6;
  const targetSeconds = targetHours * 60 * 60;
  
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.username} (${user.id})`);
    
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
    
    console.log(`✅ Successfully set ${username}'s study time to ${targetHours} hours (${targetSeconds} seconds)`);
    console.log(`DailyStat ID: ${dailyStat.id}`);
    console.log(`Date: ${today.toDateString()}`);
    
  } catch (error) {
    console.error("Error setting study time:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setUserStudyTime();
