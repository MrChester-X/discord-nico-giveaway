import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { GiveawayDto } from './dto/giveaway.dto';
import { Giveaway, GiveawayStatus } from './entities/giveaway.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JOIN_BUTTON_INTERACTION_NAME,
  MAP_LETTERS_DURATION,
  MAP_STATUS_TEXT,
  PARTICIPANTS_BUTTON_INTERACTION_NAME,
} from './giveaway.const';
import { ParticipantService } from '../participant/participant.service';
import { UtilsService } from '../utils/utils.service';
import { Participant } from '../participant/entities/participant.entity';

@Injectable()
export class GiveawayService {
  @InjectRepository(Giveaway)
  private giveawayRepository: Repository<Giveaway>;

  constructor(
    private client: Client,
    private participantService: ParticipantService,
    private utilsService: UtilsService,
  ) {}

  async delete(giveaway: Giveaway) {
    giveaway = await this.giveawayRepository.softRemove(giveaway);
  }

  async startGiveaway(interaction: CommandInteraction, giveawayDto: GiveawayDto) {
    if (!interaction.guild || !interaction.channel) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    if (giveawayDto.winners !== null && giveawayDto.winners <= 0) {
      return interaction.editReply({
        content: 'Ты еблан, как может быть меньше 1 победителя?',
      });
    }

    const durationTime = this.parseDuration(giveawayDto.duration);
    const endedAt = new Date(Date.now().valueOf() + durationTime * 1000);

    let giveaway = new Giveaway();
    giveaway.participants = [];
    giveaway.status = GiveawayStatus.None;
    giveaway.guildId = interaction.guild.id;
    giveaway.channelId = interaction.channel.id;
    giveaway.title = giveawayDto.title;
    giveaway.startedAt = new Date();
    giveaway.endedAt = endedAt;

    if (giveawayDto.winners) {
      giveaway.countOfWinners = giveawayDto.winners;
    }

    giveaway = await this.giveawayRepository.save(giveaway);

    giveaway.status = GiveawayStatus.InProgress;

    const messageOptions = this.getGiveawayMessage(giveaway);
    const channel = interaction.channel;
    const infoMessage = await channel.send(messageOptions);

    giveaway.messageInfoId = infoMessage.id;

    giveaway = await this.giveawayRepository.save(giveaway);

    await interaction.editReply({
      content: `Создан розыгрыш с ID: \`${giveaway.uuid}\``,
    });
  }

  async endGiveaway(giveaway: Giveaway) {
    const guild = this.client.guilds.cache.get(giveaway.guildId);
    if (!guild) {
      return;
    }

    const channel = guild.channels.cache.get(giveaway.channelId);
    if (!channel || !channel.isTextBased()) {
      return;
    }

    if (!giveaway.messageInfoId) {
      return;
    }
    const infoMessage = await this.utilsService.fetchSafeMessage(channel, giveaway.messageInfoId);
    if (!infoMessage) {
      return;
    }

    const winners: GuildMember[] = [];
    const participants = giveaway.participants.slice();

    while (winners.length < giveaway.countOfWinners && participants.length) {
      const randomIndex = this.utilsService.getRandomNumber(0, participants.length - 1);
      const participant = participants[randomIndex];

      participants.splice(randomIndex, 1);

      const member = await this.utilsService.fetchSafeMember(guild, participant.discordId);
      if (!member) {
        continue;
      }

      await this.participantService.giveWin(participant);
      winners.push(member);
    }

    const winMessageOptions = this.getGiveawayEndMessage(giveaway, winners);
    const winMessage = await infoMessage.reply(winMessageOptions);

    giveaway.status = GiveawayStatus.Finished;
    giveaway.messageWinId = winMessage.id;

    await this.giveawayRepository.save(giveaway);
  }

  getGiveawayEndMessage(giveaway: Giveaway, winners: GuildMember[]) {
    const embed = new EmbedBuilder({
      title: `Конец розыгрыша | ${giveaway.title}`,
      footer: {
        text: `Принимали участие: ${giveaway.participants.length} чел.`,
      },
    });

    if (winners.length <= 0) {
      embed.setDescription(`Никто не участвовал в розыгрыше, поэтому победителей нет =(`);
    } else {
      embed.setDescription(`Победители: ${winners.map((winner) => `${winner}`).join(', ')}`);
    }

    let content = '';
    if (winners.length > 0) {
      content = `||${winners.map((winner) => `${winner}`).join(' ')}||`;
    }

    const message: BaseMessageOptions = {
      content,
      embeds: [embed],
    };

    return message;
  }

  getGiveawayMessage(giveaway: Giveaway): BaseMessageOptions {
    const timestampEnd = Math.floor(giveaway.endedAt.valueOf() / 1000);

    const embed = new EmbedBuilder({
      title: `Розыгрыш | ${giveaway.title}`,
      description: `**:watch: Выбор победителей:** <t:${timestampEnd}:f> (<t:${timestampEnd}:R>)\n\nЧтобы участвовать в розыгрыше, **зайдите в любой голосовой канал** и нажмите кнопку ниже`,
      fields: [
        {
          name: 'Кол-во победителей',
          value: `\`\`\`${giveaway.countOfWinners} чел.\`\`\``,
          inline: true,
        },
        {
          name: 'Осталось времени',
          value: `\`\`\`${this.formatTime(giveaway)}\`\`\``,
          inline: true,
        },
      ],
      footer: {
        text: `Принимают участие: ${giveaway.participants.length} чел.`,
      },
      color: 0x0379ff,
    });

    const joinButton = new ButtonBuilder({
      customId: JOIN_BUTTON_INTERACTION_NAME,
      label: 'Участвовать',
      style: ButtonStyle.Success,
    });

    const participantsButton = new ButtonBuilder({
      customId: PARTICIPANTS_BUTTON_INTERACTION_NAME,
      label: 'Участники',
      style: ButtonStyle.Secondary,
    });

    const row = new ActionRowBuilder<ButtonBuilder>({ components: [joinButton, participantsButton] });

    const message: BaseMessageOptions = {
      content: '',
      embeds: [embed],
      components: [row],
    };

    return message;
  }

  parseDuration(duration: string) {
    let totalTime = 0;

    const intervals = duration.split(' ');
    for (const interval of intervals) {
      const num = Number.parseInt(interval.slice(0, interval.length - 1));
      const letter = interval[interval.length - 1];

      if (!num || !(letter in MAP_LETTERS_DURATION)) {
        continue;
      }

      const intervalTime = num * MAP_LETTERS_DURATION[letter];
      totalTime += intervalTime;
    }

    return totalTime;
  }

  getRemainingTime(giveaway: Giveaway) {
    const time = Math.floor((giveaway.endedAt.valueOf() - Date.now().valueOf()) / 1000);

    return time;
  }

  formatTime(giveaway: Giveaway) {
    const time = this.getRemainingTime(giveaway);
    if (time <= 0) {
      return 'Завершен';
    }

    const seconds = time % 60;
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600) % 24;
    const days = Math.floor(time / 86400);

    if (days) {
      return `${days} дн ${hours} ч`;
    }

    if (hours) {
      return `${hours} ч ${minutes} м`;
    }

    if (minutes) {
      return `${minutes} м ${seconds} с`;
    }

    if (seconds) {
      return `${seconds} с`;
    }

    return `ошибка =(`;
  }

  async onJoinButton(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { guild, channel, message, member } = interaction;

    if (!guild || !channel || !member || !(member instanceof GuildMember)) {
      return interaction.editReply({
        content: 'Что-то пошло не так =(',
      });
    }

    const giveaway = await this.giveawayRepository.findOne({
      where: {
        status: GiveawayStatus.InProgress,
        guildId: guild.id,
        channelId: channel.id,
        messageInfoId: message.id,
      },
    });

    if (!giveaway) {
      return interaction.editReply({
        content: 'Данный розыгрыш уже неактивен',
      });
    }

    const isExist = await this.participantService.isExist(member, giveaway);
    if (isExist) {
      return interaction.editReply({
        content: 'Вы уже участвуете в этом розыгрыше',
      });
    }

    if (!member.voice.channel) {
      return interaction.editReply({
        content: 'Вам необходимо быть в любом голосовом канале, чтобы участвовать в розыгрыше',
      });
    }

    await this.participantService.create(member, giveaway);

    return interaction.editReply({
      content: 'Вы приняли участие в розыгрыше',
    });
  }

  async onParticipantsButton(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { guild, channel, message, member } = interaction;

    if (!guild || !channel || !member || !(member instanceof GuildMember)) {
      return interaction.editReply({
        content: 'Что-то пошло не так =(',
      });
    }

    const giveaway = await this.giveawayRepository.findOne({
      relations: {
        participants: true,
      },
      where: {
        guildId: guild.id,
        channelId: channel.id,
        messageInfoId: message.id,
      },
    });

    if (!giveaway) {
      return interaction.editReply({
        content: 'Данный розыгрыш уже неактивен',
      });
    }

    let participantsText = giveaway.participants.map((participant) => `<@${participant.discordId}>`).join(', ');
    if (!giveaway.participants.length) {
      participantsText = 'Еще нет участников =(';
    }

    const embed = new EmbedBuilder({
      title: 'Участники розыгрыша:',
      description: `${participantsText}`,
      footer: {
        text: `Принимают участие: ${giveaway.participants.length} чел.`,
      },
    });

    return interaction.editReply({
      content: '',
      embeds: [embed],
    });
  }
}
