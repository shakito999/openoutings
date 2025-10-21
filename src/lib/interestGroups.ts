import { BILINGUAL_INTERESTS, BilingualInterest } from './interestsBilingual'

export interface InterestGroup {
  id: string
  bg: string
  en: string
  emoji: string
  interests: string[] // canonical interest names
}

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    id: 'outdoor',
    bg: 'На открито и приключения',
    en: 'Outdoor & Adventure',
    emoji: '🏔️',
    interests: [
      'Планинарство',
      'Trekking',
      'Катерене',
      'Къмпинг',
      'Колоездене',
      'Планинско колоездене',
      'Конна езда',
      'Риболов',
      'Парапланеризъм',
      'Фотография с дрон',
    ]
  },
  {
    id: 'winter',
    bg: 'Зимни спортове',
    en: 'Winter Sports',
    emoji: '⛷️',
    interests: ['Ски', 'Сноуборд']
  },
  {
    id: 'fitness',
    bg: 'Фитнес и тренировки',
    en: 'Fitness & Training',
    emoji: '💪',
    interests: [
      'Бягане',
      'Фитнес',
      'Кросфит',
      'Йога',
      'Пилатес',
      'Плуване',
      'Бойни изкуства',
    ]
  },
  {
    id: 'team-sports',
    bg: 'Отборни спортове',
    en: 'Team Sports',
    emoji: '⚽',
    interests: [
      'Футбол',
      'Баскетбол',
      'Волейбол',
      'Тенис',
      'Бадминтон',
    ]
  },
  {
    id: 'dance',
    bg: 'Танци',
    en: 'Dance & Movement',
    emoji: '💃',
    interests: ['Танци', 'Зумба']
  },
  {
    id: 'arts',
    bg: 'Изкуства и творчество',
    en: 'Arts & Creativity',
    emoji: '🎨',
    interests: [
      'Фотография',
      'Живопис',
      'Рисуване',
      'Изкуство',
      'Ръкоделие',
      'Дизайн',
    ]
  },
  {
    id: 'music',
    bg: 'Музика и изпълнения',
    en: 'Music & Performance',
    emoji: '🎵',
    interests: [
      'Музика',
      'Пеене',
      'Китара',
      'Пиано',
      'Караоке',
      'Театър',
    ]
  },
  {
    id: 'culture',
    bg: 'Култура и забавление',
    en: 'Culture & Entertainment',
    emoji: '🎭',
    interests: [
      'Кино',
      'Музеи',
      'Фолклор',
      'Български традиции',
      'Исторически места',
    ]
  },
  {
    id: 'food',
    bg: 'Храна и напитки',
    en: 'Food & Drink',
    emoji: '🍷',
    interests: [
      'Готвене',
      'Кафе',
      'Пиво',
      'Вино',
      'Дегустации',
    ]
  },
  {
    id: 'games',
    bg: 'Игри и социални',
    en: 'Games & Social',
    emoji: '🎲',
    interests: [
      'Настолни игри',
      'Игри на карти',
      'Белот',
      'Покер',
      'Видео игри',
      'Гейминг',
      'Нощен живот',
    ]
  },
  {
    id: 'travel',
    bg: 'Пътувания и места',
    en: 'Travel & Places',
    emoji: '🗺️',
    interests: [
      'Пътувания',
      'Екскурзии',
      'Витоша',
      'Рила',
      'Пирин',
      'Банско',
      'Боровец',
      'Черноморие',
    ]
  },
  {
    id: 'wellness',
    bg: 'Здраве и уелнес',
    en: 'Wellness & Health',
    emoji: '🧘',
    interests: [
      'Медитация',
      'Спа',
      'Масаж',
      'Минерални бани',
      'Здравословен живот',
      'Вегетарианство',
      'Веганство',
    ]
  },
  {
    id: 'animals',
    bg: 'Животни',
    en: 'Animals & Pets',
    emoji: '🐕',
    interests: [
      'Кучета',
      'Котки',
      'Разходки с кучета',
      'Животни',
    ]
  },
  {
    id: 'learning',
    bg: 'Учене и развитие',
    en: 'Learning & Development',
    emoji: '📚',
    interests: [
      'Езици',
      'Английски',
      'Четене',
      'Писане',
    ]
  },
  {
    id: 'tech',
    bg: 'Технологии',
    en: 'Tech & Innovation',
    emoji: '💻',
    interests: [
      'Програмиране',
      'Технологии',
      'AI/ML',
      'Блокчейн',
      'Крипто',
    ]
  },
  {
    id: 'professional',
    bg: 'Професионално развитие',
    en: 'Professional & Networking',
    emoji: '🤝',
    interests: [
      'Предприемачество',
      'Стартъпи',
      'Networking',
      'Доброволчество',
    ]
  },
]

// Helper to get group display name
export function getGroupDisplay(groupId: string, language: 'bg' | 'en' = 'bg'): string {
  const group = INTEREST_GROUPS.find(g => g.id === groupId)
  if (!group) return groupId
  return language === 'en' ? group.en : group.bg
}

// Helper to find which group an interest belongs to
export function getGroupForInterest(canonical: string): InterestGroup | undefined {
  return INTEREST_GROUPS.find(group => group.interests.includes(canonical))
}

// Helper to search interests across groups
export function searchInterestsInGroups(query: string, language: 'bg' | 'en' = 'bg'): InterestGroup[] {
  const q = query.toLowerCase()
  
  return INTEREST_GROUPS.map(group => {
    const matchingInterests = group.interests.filter(canonical => {
      const interest = BILINGUAL_INTERESTS.find(i => i.canonical === canonical)
      if (!interest) return false
      return (
        interest.bg.toLowerCase().includes(q) ||
        interest.en.toLowerCase().includes(q)
      )
    })
    
    return {
      ...group,
      interests: matchingInterests
    }
  }).filter(group => group.interests.length > 0)
}

// Export flattened list of all interests from groups
// This is the single source of truth for the complete interest list
export const INTERESTS = INTEREST_GROUPS.flatMap(group => group.interests)
