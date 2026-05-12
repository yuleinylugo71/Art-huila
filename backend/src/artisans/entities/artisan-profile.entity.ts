import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Region } from '../../regions/entities/region.entity';
import { Category } from '../../categories/entities/category.entity';
import { ArtisanGallery } from './artisan-gallery.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('artisan_profiles')
export class ArtisanProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ unique: true })
  id_number: string; // Cédula

  @Column({ type: 'text' })
  cultural_history: string;

  @ManyToOne(() => Category)
  @JoinColumn()
  category: Category;

  @ManyToOne(() => Region)
  @JoinColumn()
  region: Region;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  verification_status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ default: false })
  truthfulness_declaration: boolean;

  @Column({ nullable: true })
  avatar_url: string;

  @OneToMany(() => ArtisanGallery, gallery => gallery.profile)
  gallery: ArtisanGallery[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
