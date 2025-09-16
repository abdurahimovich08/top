import { PrismaClient, UserRole, KycStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Barber', slug: 'barber', description: 'Professional barber services' },
    { name: 'Tutor', slug: 'tutor', description: 'Private tutoring and mentoring' },
    { name: 'Plumber', slug: 'plumber', description: 'Emergency plumbing and repairs' },
    { name: 'Developer', slug: 'developer', description: 'Custom software development' },
  ];

  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.upsert({
      where: { phone: `+9989000000${i}` },
      update: {},
      create: {
        phone: `+9989000000${i}`,
        role: i % 2 === 0 ? UserRole.PROVIDER : UserRole.CUSTOMER,
        firstName: `User${i}`,
      },
    });

    if (user.role === UserRole.PROVIDER) {
      const provider = await prisma.provider.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          businessName: `Provider ${i}`,
          bio: 'Experienced professional ready to help.',
          kycStatus: KycStatus.APPROVED,
          verifiedAt: new Date(),
        },
      });

      const category = await prisma.category.findFirst();
      if (category) {
        await prisma.providerCategory.upsert({
          where: { providerId_categoryId: { providerId: provider.id, categoryId: category.id } },
          update: {},
          create: { providerId: provider.id, categoryId: category.id },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
