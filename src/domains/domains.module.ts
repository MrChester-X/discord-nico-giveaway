import { Module } from '@nestjs/common';
import { GiveawayModule } from './giveaway/giveaway.module';
import { ParticipantModule } from './participant/participant.module';

@Module({
  imports: [GiveawayModule, ParticipantModule],
})
export class DomainsModule {}
