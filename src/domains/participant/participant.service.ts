import { Injectable } from '@nestjs/common';
import { EmbedBuilder, GuildMember } from 'discord.js';
import { Giveaway, GiveawayStatus } from '../giveaway/entities/giveaway.entity';
import { Repository } from 'typeorm';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Context, ContextOf, On } from 'necord';

@Injectable()
export class ParticipantService {
  @InjectRepository(Participant)
  private participantRepository: Repository<Participant>;

  async create(member: GuildMember, giveaway: Giveaway) {
    let participant = new Participant();
    participant.discordId = member.id;
    participant.giveaway = giveaway;
    participant.status = ParticipantStatus.Joined;

    participant = await this.participantRepository.save(participant);

    return participant;
  }

  async isExist(member: GuildMember, giveaway: Giveaway) {
    const participant = await this.participantRepository.findOne({
      where: {
        discordId: member.id,
        giveaway: {
          uuid: giveaway.uuid,
        },
      },
    });

    if (participant) {
      return true;
    }

    return false;
  }

  async giveWin(participant: Participant) {
    participant.status = ParticipantStatus.Winner;

    await this.participantRepository.save(participant);
  }

  async kickMemberFromAllGiveaways(member: GuildMember) {
    const memberParticipants = await this.participantRepository.find({
      where: {
        discordId: member.id,
        giveaway: {
          status: GiveawayStatus.InProgress,
        },
      },
    });

    if (memberParticipants.length <= 0) {
      return;
    }

    await this.participantRepository.softRemove(memberParticipants);

    try {
      const embed = new EmbedBuilder({
        title: 'Исключен из розыгрыша',
        description: ':red_circle: Вы покинули голосовой канал, поэтому больше не участвуете в конкурсе',
      });

      member.send({ content: '', embeds: [embed] });
    } catch {}
  }

  @On('voiceStateUpdate')
  async onGuildMemberUpdate(@Context() [oldState, newState]: ContextOf<'voiceStateUpdate'>) {
    if (oldState.channel && !newState.channel && newState.member) {
      await this.kickMemberFromAllGiveaways(newState.member);
    }
  }
}
