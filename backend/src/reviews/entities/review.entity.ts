import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: false })
  is_reported: boolean;

  @Column({ type: 'text', nullable: true })
  report_reason: string | null;

  @Column({ type: 'text', nullable: true })
  artisan_response: string | null;

  @Column({ type: 'timestamp', nullable: true })
  responded_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
