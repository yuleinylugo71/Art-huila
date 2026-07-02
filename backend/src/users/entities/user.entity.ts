import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUYER })
  role: UserRole;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ nullable: true })
  @Exclude()
  email_verification_token: string;

  @Column({ type: 'timestamp', nullable: true })
  email_token_expires_at: Date | null;

  @Column({ default: 0 })
  @Exclude()
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  locked_until: Date | null;

  @Column({ nullable: true })
  @Exclude()
  reset_password_token: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_password_expires: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  department: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
