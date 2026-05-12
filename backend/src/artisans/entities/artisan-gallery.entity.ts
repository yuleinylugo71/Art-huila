import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ArtisanProfile } from './artisan-profile.entity';

@Entity('artisan_gallery')
export class ArtisanGallery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  public_id: string;

  @ManyToOne(() => ArtisanProfile, profile => profile.gallery, { onDelete: 'CASCADE' })
  @JoinColumn()
  profile: ArtisanProfile;

  @CreateDateColumn()
  created_at: Date;
}
