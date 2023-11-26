import { Giveaway } from 'src/domains/giveaway/entities/giveaway.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ParticipantStatus {
  None = 'none',
  Joined = 'joined',
  Winner = 'winner',
}

@Entity({ name: 'participants' })
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Giveaway, (giveaway) => giveaway.participants)
  giveaway: Giveaway;

  @Column({ type: 'varchar' })
  discordId: string;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.None,
  })
  status: ParticipantStatus = ParticipantStatus.None;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
