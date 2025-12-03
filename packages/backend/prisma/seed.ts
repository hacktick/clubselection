import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    // Create initial admin user (username: admin, password: admin)
    const hashedPassword = await bcrypt.hash('admin', 10);

    const admin = await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            name: 'Administrator',
        },
    });

    console.log('✓ Created admin user:', { username: admin.username, name: admin.name });

    // You can add more seed data here if needed
    // For example, test students, projects, etc.

    console.log('✓ Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
