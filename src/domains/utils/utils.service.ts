import { Injectable } from '@nestjs/common';
import { Guild, GuildMember, Message, TextBasedChannel } from 'discord.js';

@Injectable()
export class UtilsService {
  getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async fetchSafeMessage(
    channel: TextBasedChannel,
    messageId: string,
  ): Promise<Message | null> {
    try {
      const message = await channel.messages.fetch(messageId);

      return message;
    } catch (e) {}

    return null;
  }

  async fetchSafeMember(
    guild: Guild,
    memberId: string,
  ): Promise<GuildMember | null> {
    try {
      const message = await guild.members.fetch(memberId);

      return message;
    } catch (e) {}

    return null;
  }
}
