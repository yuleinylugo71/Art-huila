import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  product: Product;

  @Column('int')
  quantity: number;

  @Column('numeric', { precision: 10, scale: 2 })
  unit_price: number;

  @Column('numeric', { precision: 10, scale: 2 })
  subtotal: number;
}
