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
import { ArtisanProfile } from '../../artisans/entities/artisan-profile.entity';
import { Category } from '../../categories/entities/category.entity';
import { Region } from '../../regions/entities/region.entity';
import { ProductImage } from './product-image.entity';
import { Review } from '../../reviews/entities/review.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column('numeric', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  stock: number;

  @ManyToOne(() => ArtisanProfile)
  @JoinColumn()
  artisan: ArtisanProfile;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn()
  category: Category;

  @ManyToOne(() => Region, (region) => region.products)
  @JoinColumn()
  region: Region;

  @Column({ type: 'text' })
  cultural_origin: string;

  @Column({ type: 'text' })
  technique: string;

  @Column({ type: 'text' })
  significance: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  short_description: string;

  @Column({ type: 'text', nullable: true })
  materials: string;

  @Column({ type: 'varchar', nullable: true })
  dimensions: string;

  @Column({ type: 'varchar', nullable: true })
  weight: string;

  @Column({ type: 'text', nullable: true })
  care_instructions: string;

  @Column({ type: 'boolean', default: true, nullable: true })
  is_handmade: boolean;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
