import { NumberOption, StringOption } from 'necord';

export class GiveawayDto {
  @StringOption({
    name: 'title',
    description: 'Заголовок розыгрыша',
    required: true,
  })
  title: string;

  @StringOption({
    name: 'duration',
    description: 'Длительность розыгрыша (используйте числа и буквы: s, m, h, d)',
    required: true,
  })
  duration: string;

  @NumberOption({
    name: 'winners',
    description: 'Кол-во победителей (default 1)',
    required: false,
  })
  winners: number | null;
}
