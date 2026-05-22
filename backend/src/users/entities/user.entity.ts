import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum Role {
  ADMIN = 'admin',
  ARTESANO = 'artesano',
  COMPRADOR = 'comprador',
}

export const UserRole = {
  ADMIN: Role.ADMIN,
  ARTISAN: Role.ARTESANO,
  BUYER: Role.COMPRADOR,
} as const;

export type UserRole = Role;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: Role, default: Role.COMPRADOR })
  role: Role;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ nullable: true })
  email_verification_token: string;

  @Column({ type: 'timestamp', nullable: true })
  email_token_expires_at: Date | null;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
