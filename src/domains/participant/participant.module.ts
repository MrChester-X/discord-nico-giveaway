import { Module, forwardRef } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { GiveawayModule } from '../giveaway/giveaway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Participant])],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
