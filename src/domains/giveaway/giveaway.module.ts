import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Giveaway } from './entities/giveaway.entity';
import { GiveawayCommands } from './giveaway.commands';
import { GiveawayService } from './giveaway.service';
import { GiveawayCheckerService } from './giveaway-checker.service';
import { ParticipantModule } from '../participant/participant.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [TypeOrmModule.forFeature([Giveaway]), ParticipantModule, UtilsModule],
  providers: [GiveawayCommands, GiveawayService, GiveawayCheckerService],
})
export class GiveawayModule {}
