import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  APPROVE_ARTISAN = 'approve_artisan',
  REJECT_ARTISAN = 'reject_artisan',
  SUSPEND_ARTISAN = 'suspend_artisan',
  DELETE_REVIEW = 'delete_review',
  UPDATE_ORDER = 'update_order',
  HIDE_PRODUCT = 'hide_product',
  DELETE_PRODUCT = 'delete_product',
  BULK_UPLOAD_PRODUCTS = 'bulk_upload_products',
}

@Entity('admin_audit_log')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'uuid' })
  target_id: string; // The ID of the affected artisan profile

  @Column({ type: 'text', nullable: true })
  details: string;

  @CreateDateColumn()
  created_at: Date;
}
