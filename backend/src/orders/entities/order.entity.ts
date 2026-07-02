import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

import { OrderStatus } from '../../common/constants';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column('numeric', { precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  payment_status: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  shipping_cost: number;

  @Column({ type: 'int', nullable: true })
  estimated_delivery_days: number;

  @Column({ type: 'jsonb', nullable: true })
  shipping_address: any;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  payment_id: string; // ID from external payment gateway

  @Column({ nullable: true })
  tracking_number: string;

  @Column({ nullable: true })
  shipping_company: string;

  @Column({ nullable: true })
  tracking_url: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
