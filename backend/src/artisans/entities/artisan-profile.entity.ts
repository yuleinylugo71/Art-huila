import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Region } from '../../regions/entities/region.entity';
import { Category } from '../../categories/entities/category.entity';
import { ArtisanGallery } from './artisan-gallery.entity';

export enum ArtisanStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended',
}

export { ArtisanStatus as VerificationStatus };

@Entity('artisan_profiles')
export class ArtisanProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ unique: true, nullable: true })
  id_number: string; // Cédula

  @Column({ type: 'text' })
  cultural_history: string;

  @ManyToOne(() => Category)
  @JoinColumn()
  category: Category;

  @ManyToOne(() => Region)
  @JoinColumn()
  region: Region;

  @Column({ type: 'enum', enum: ArtisanStatus, default: ArtisanStatus.PENDING })
  verification_status: ArtisanStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ default: false })
  truthfulness_declaration: boolean;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', nullable: true })
  id_document_front_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  id_document_back_url: string | null;

  @OneToMany(() => ArtisanGallery, gallery => gallery.profile)
  gallery: ArtisanGallery[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
