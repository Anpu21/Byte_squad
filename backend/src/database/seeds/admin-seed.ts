import {
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import path from 'node:path';

/**
 * Inline User entity for the seed script.
 * We duplicate the entity here so the seed can run standalone via ts-node
 * without needing NestJS module resolution.
 */
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', default: 'cashier' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Admin seed script.
 * Creates a default Admin user so the application can be used immediately.
 *
 * Usage: npm run seed
 * Default credentials: admin / admin123
 */
async function seed() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.join(process.cwd(), 'data.sqlite'),
    entities: [User],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected.');

  const userRepo = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepo.findOne({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.');
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await userRepo.save({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Default Admin user created successfully.');
    console.log('   Username: admin');
    console.log('   Password: admin123');
  }

  await dataSource.destroy();
  console.log('Database connection closed.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
