import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Giveaway, GiveawayStatus } from './entities/giveaway.entity';
import { Client, Guild, Message, TextBasedChannel } from 'discord.js';
import { GiveawayService } from './giveaway.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class GiveawayCheckerService {
  @InjectRepository(Giveaway)
  private giveawayRepository: Repository<Giveaway>;

  constructor(private client: Client, private giveawayService: GiveawayService, private utilsService: UtilsService) {}

  @Cron('*/5 * * * * *')
  async checkCurrentGiveaways() {
    if (!this.client.isReady()) {
      return;
    }

    const giveaways = await this.giveawayRepository.find({
      relations: {
        participants: true,
      },
      where: {
        status: GiveawayStatus.InProgress,
      },
    });

    for (const giveaway of giveaways) {
      this.checkGiveaway(giveaway);
    }
  }

  async checkGiveaway(giveaway: Giveaway) {
    const guild = this.client.guilds.cache.get(giveaway.guildId);
    if (!guild) {
      await this.giveawayService.delete(giveaway);
      return;
    }

    const channel = guild.channels.cache.get(giveaway.channelId);
    if (!channel || !channel.isTextBased()) {
      await this.giveawayService.delete(giveaway);
      return;
    }

    await this.updateMessageInfo(giveaway, guild, channel);
    if (giveaway.deletedAt) {
      return;
    }

    const time = this.giveawayService.getRemainingTime(giveaway);
    if (time <= 0) {
      await this.giveawayService.endGiveaway(giveaway);
    }
  }

  async updateMessageInfo(giveaway: Giveaway, guild: Guild, channel: TextBasedChannel) {
    if (!giveaway.messageInfoId) {
      return;
    }

    const infoMessage = await this.utilsService.fetchSafeMessage(channel, giveaway.messageInfoId);
    if (!infoMessage) {
      await this.giveawayService.delete(giveaway);
      return;
    }

    const messageOptions = this.giveawayService.getGiveawayMessage(giveaway);
    await infoMessage.edit(messageOptions);
  }
}
