import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'demo@whiteboard.com' },
    update: {},
    create: {
      email: 'demo@whiteboard.com',
      username: 'demo_user',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'artist@whiteboard.com' },
    update: {},
    create: {
      email: 'artist@whiteboard.com',
      username: 'artist_user',
      password: hashedPassword,
    },
  });
  // Create demo boards
  const demoBoard1 = await prisma.board.create({
    data: {
      title: 'Welcome Board',
      description: 'A sample whiteboard to get you started',
      isPublic: true,
      isTemplate: true,
      userId: user1.id,
      content: {
        version: '5.2.4',
        objects: [
          {
            type: 'textbox',
            left: 100,
            top: 100,
            width: 200,
            height: 50,
            text: 'Welcome to Whiteboard!',
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#1f2937'
          },
          {
            type: 'rect',
            left: 100,
            top: 200,
            width: 150,
            height: 100,
            fill: '#3b82f6',
            stroke: '#1d4ed8',
            strokeWidth: 2
          }
        ]
      }
    }
  });
  const demoBoard2 = await prisma.board.create({
    data: {
      title: 'Wireframe Template',
      description: 'Template for creating UI wireframes',
      isPublic: true,
      isTemplate: true,
      userId: user2.id,
      content: {
        version: '5.2.4',
        objects: [
          {
            type: 'rect',
            left: 50,
            top: 50,
            width: 300,
            height: 60,
            fill: '#e5e7eb',
            stroke: '#9ca3af',
            strokeWidth: 1
          },
          {
            type: 'textbox',
            left: 60,
            top: 70,
            width: 100,
            height: 20,
            text: 'Header',
            fontSize: 16,
            fontFamily: 'Arial',
            fill: '#374151'
          }
        ]
      }
    }
  });

  // Add collaborator relationship
  await prisma.boardCollaborator.create({
    data: {
      boardId: demoBoard1.id,
      userId: user2.id,
      role: 'editor'
    }
  }).catch(() => {
    // Ignore if already exists
    console.log('Collaborator relationship already exists');
  });

  // Add some activities
  await prisma.boardActivity.createMany({
    data: [
      {
        boardId: demoBoard1.id,
        userId: user1.id,
        action: 'created',
        details: { title: 'Welcome Board' }
      },
      {
        boardId: demoBoard1.id,
        userId: user2.id,
        action: 'collaborator_added',
        details: { role: 'editor' }
      },
      {
        boardId: demoBoard2.id,
        userId: user2.id,
        action: 'created',
        details: { title: 'Wireframe Template' }
      }
    ]
  });

  console.log('Database seeding completed successfully!');
  console.log('Demo users created:');
  console.log('- demo@whiteboard.com (password: password123)');
  console.log('- artist@whiteboard.com (password: password123)');
  console.log('Demo boards created:');
  console.log('- Welcome Board (public)');
  console.log('- Wireframe Template (public)');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
