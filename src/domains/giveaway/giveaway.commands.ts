import { Injectable } from '@nestjs/common';
import { GiveawayDto } from './dto/giveaway.dto';
import { Button, ButtonContext, Context, Options, SlashCommandContext, Subcommand } from 'necord';
import { GiveawayCommandGroup } from './giveaway.decorator';
import { GiveawayService } from './giveaway.service';
import { JOIN_BUTTON_INTERACTION_NAME, PARTICIPANTS_BUTTON_INTERACTION_NAME } from './giveaway.const';

@GiveawayCommandGroup()
@Injectable()
export class GiveawayCommands {
  constructor(private giveawayService: GiveawayService) {}

  @Subcommand({
    name: 'start',
    description: 'Запустить розыгрыш',
  })
  async onStart(@Context() [interaction]: SlashCommandContext, @Options() giveawayDto: GiveawayDto) {
    this.giveawayService.startGiveaway(interaction, giveawayDto);
  }

  @Button(JOIN_BUTTON_INTERACTION_NAME)
  async onJoinButton(@Context() [interaction]: ButtonContext) {
    this.giveawayService.onJoinButton(interaction);
  }

  @Button(PARTICIPANTS_BUTTON_INTERACTION_NAME)
  async onParticipantsButton(@Context() [interaction]: ButtonContext) {
    this.giveawayService.onParticipantsButton(interaction);
  }
}
