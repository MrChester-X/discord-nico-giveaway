import { Participant } from 'src/domains/participant/entities/participant.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GiveawayStatus {
  None = 'none',
  InProgress = 'in_progress',
  Finished = 'finished',
}

@Entity({ name: 'giveaways' })
export class Giveaway {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar' })
  guildId: string;

  @Column({ type: 'varchar' })
  channelId: string;

  @OneToMany(() => Participant, (participant) => participant.giveaway)
  participants: Participant[];

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  countOfWinners = 1;

  @Column({ type: 'varchar', nullable: true })
  messageInfoId?: string;

  @Column({ type: 'varchar', nullable: true })
  messageWinId?: string;

  @Column({ type: 'timestamp without time zone' })
  startedAt: Date;

  @Column({ type: 'timestamp without time zone' })
  endedAt: Date;

  @Column({
    type: 'enum',
    enum: GiveawayStatus,
    default: GiveawayStatus.None,
  })
  status: GiveawayStatus = GiveawayStatus.None;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
