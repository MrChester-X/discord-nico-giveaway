import { GiveawayStatus } from './entities/giveaway.entity';

export const TITLE_MIN_LENGTH = 1;
export const TITLE_MAX_LENGTH = 20;

export const JOIN_BUTTON_INTERACTION_NAME = 'giveaway_join';
export const PARTICIPANTS_BUTTON_INTERACTION_NAME = 'giveaway_participants';

export const MAP_LETTERS_DURATION: { [id: string]: number } = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

export const MAP_STATUS_TEXT = {
  [GiveawayStatus.None]: 'чет пошло не так =(',
  [GiveawayStatus.InProgress]: '<a:IMG_5053:1075920982482616331> **Статус:** ожидание участников...',
  [GiveawayStatus.Finished]: ':red_circle: **Статус:** закончился',
};
