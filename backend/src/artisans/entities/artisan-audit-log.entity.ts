import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ArtisanAuditAction {
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
  REACTIVATED = 'REACTIVATED',
}

@Entity('artisan_audit_logs')
export class ArtisanAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  artisanId: string;

  @Column({ type: 'enum', enum: ArtisanAuditAction })
  action: ArtisanAuditAction;

  @Column()
  adminId: string;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
