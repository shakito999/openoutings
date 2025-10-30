import { getGroupForInterest } from '@/lib/interestGroups'

const INTEREST_EMOJI: Record<string, string> = {
  // Outdoor & Adventure
  'Планинарство': '🥾',
  'Trekking': '🥾',
  'Катерене': '🧗',
  'Къмпинг': '🏕️',
  'Колоездене': '🚴',
  'Планинско колоездене': '🚵',
  'Конна езда': '🐎',
  'Риболов': '🎣',
  'Парапланеризъм': '🪂',
  'Фотография с дрон': '🚁',

  // Winter Sports
  'Ски': '🎿',
  'Сноуборд': '🏂',

  // Fitness & Training
  'Бягане': '🏃',
  'Фитнес': '🏋️',
  'Кросфит': '🏋️‍♀️',
  'Йога': '🧘',
  'Пилатес': '🧘',
  'Плуване': '🏊',
  'Бойни изкуства': '🥋',

  // Team Sports
  'Футбол': '⚽',
  'Баскетбол': '🏀',
  'Волейбол': '🏐',
  'Тенис': '🎾',
  'Бадминтон': '🏸',

  // Dance & Movement
  'Танци': '💃',
  'Зумба': '💃',

  // Arts & Creativity
  'Фотография': '📸',
  'Живопис': '🎨',
  'Рисуване': '🖌️',
  'Изкуство': '🎨',
  'Ръкоделие': '🧵',
  'Дизайн': '📐',

  // Music & Performance
  'Музика': '🎵',
  'Пеене': '🎤',
  'Китара': '🎸',
  'Пиано': '🎹',
  'Караоке': '🎤',
  'Театър': '🎭',

  // Culture & Entertainment
  'Кино': '🎬',
  'Музеи': '🏛️',
  'Фолклор': '🎻',
  'Български традиции': '🎉',
  'Исторически места': '🏛️',

  // Food & Drink
  'Готвене': '🍳',
  'Кафе': '☕',
  'Пиво': '🍺',
  'Вино': '🍷',
  'Дегустации': '🍽️',

  // Games & Social
  'Настолни игри': '🎲',
  'Игри на карти': '🃏',
  'Белот': '🃏',
  'Покер': '🃏',
  'Видео игри': '🎮',
  'Гейминг': '🎮',
  'Нощен живот': '🍸',

  // Travel & Places
  'Пътувания': '🧳',
  'Екскурзии': '🗺️',
  'Витоша': '🏔️',
  'Рила': '🏔️',
  'Пирин': '🏔️',
  'Банско': '⛷️',
  'Боровец': '⛷️',
  'Черноморие': '🏖️',

  // Wellness & Health
  'Медитация': '🧘',
  'Спа': '♨️',
  'Масаж': '💆',
  'Минерални бани': '♨️',
  'Здравословен живот': '🥗',
  'Вегетарианство': '🥦',
  'Веганство': '🥬',

  // Animals & Pets
  'Кучета': '🐶',
  'Котки': '🐱',
  'Разходки с кучета': '🐕‍🦺',
  'Животни': '🐾',

  // Learning & Development
  'Езици': '🗣️',
  'Английски': '🇬🇧',
  'Четене': '📖',
  'Писане': '✍️',

  // Tech & Innovation
  'Програмиране': '🧑‍💻',
  'Технологии': '💡',
  'AI/ML': '🤖',
  'Блокчейн': '⛓️',
  'Крипто': '🪙',

  // Professional & Networking
  'Предприемачество': '🚀',
  'Стартъпи': '🚀',
  'Networking': '🤝',
  'Доброволчество': '🙌',
}

export function getEmojiForInterests(interests: { interests?: { name?: string } }[] | null | undefined): string {
  const first = interests?.[0]?.interests?.name
  if (first && INTEREST_EMOJI[first]) return INTEREST_EMOJI[first]
  if (first) {
    const group = getGroupForInterest(first)
    if (group?.emoji) return group.emoji
  }
  return '📍'
}

export function getEmojiForEvent(e: any): string {
  // Prefer event_interests names
  if (e?.event_interests && Array.isArray(e.event_interests) && e.event_interests.length > 0) {
    return getEmojiForInterests(e.event_interests)
  }
  // Fallback: infer from title keywords (very rough)
  const t = (e?.title || '').toLowerCase()
  if (t.includes('coffee') || t.includes('кафе')) return '☕'
  if (t.includes('hike') || t.includes('планинар')) return '🥾'
  if (t.includes('yoga') || t.includes('йога')) return '🧘'
  return '📍'
}