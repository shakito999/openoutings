// Bilingual interests - each interest has Bulgarian and English versions
export interface BilingualInterest {
  bg: string
  en: string
  canonical: string // The primary version to store in DB
}

export const BILINGUAL_INTERESTS: BilingualInterest[] = [
  // Outdoor & Adventure
  { bg: 'Планинарство', en: 'Hiking', canonical: 'Планинарство' },
  { bg: 'Trekking', en: 'Trekking', canonical: 'Trekking' },
  { bg: 'Катерене', en: 'Climbing', canonical: 'Катерене' },
  { bg: 'Къмпинг', en: 'Camping', canonical: 'Къмпинг' },
  { bg: 'Колоездене', en: 'Cycling', canonical: 'Колоездене' },
  { bg: 'Планинско колоездене', en: 'Mountain Biking', canonical: 'Планинско колоездене' },
  { bg: 'Конна езда', en: 'Horse Riding', canonical: 'Конна езда' },
  { bg: 'Риболов', en: 'Fishing', canonical: 'Риболов' },
  { bg: 'Парапланеризъм', en: 'Paragliding', canonical: 'Парапланеризъм' },
  { bg: 'Фотография с дрон', en: 'Drone Photography', canonical: 'Фотография с дрон' },
  
  // Winter Sports
  { bg: 'Ски', en: 'Skiing', canonical: 'Ски' },
  { bg: 'Сноуборд', en: 'Snowboarding', canonical: 'Сноуборд' },
  
  // Fitness & Training
  { bg: 'Бягане', en: 'Running', canonical: 'Бягане' },
  { bg: 'Фитнес', en: 'Fitness', canonical: 'Фитнес' },
  { bg: 'Кросфит', en: 'CrossFit', canonical: 'Кросфит' },
  { bg: 'Йога', en: 'Yoga', canonical: 'Йога' },
  { bg: 'Пилатес', en: 'Pilates', canonical: 'Пилатес' },
  { bg: 'Плуване', en: 'Swimming', canonical: 'Плуване' },
  { bg: 'Бойни изкуства', en: 'Martial Arts', canonical: 'Бойни изкуства' },
  
  // Team Sports
  { bg: 'Футбол', en: 'Football', canonical: 'Футбол' },
  { bg: 'Баскетбол', en: 'Basketball', canonical: 'Баскетбол' },
  { bg: 'Волейбол', en: 'Volleyball', canonical: 'Волейбол' },
  { bg: 'Тенис', en: 'Tennis', canonical: 'Тенис' },
  { bg: 'Бадминтон', en: 'Badminton', canonical: 'Бадминтон' },
  
  // Dance & Movement
  { bg: 'Танци', en: 'Dancing', canonical: 'Танци' },
  { bg: 'Зумба', en: 'Zumba', canonical: 'Зумба' },
  
  // Arts & Creativity
  { bg: 'Фотография', en: 'Photography', canonical: 'Фотография' },
  { bg: 'Живопис', en: 'Painting', canonical: 'Живопис' },
  { bg: 'Рисуване', en: 'Drawing', canonical: 'Рисуване' },
  { bg: 'Изкуство', en: 'Art', canonical: 'Изкуство' },
  { bg: 'Ръкоделие', en: 'Crafts', canonical: 'Ръкоделие' },
  { bg: 'Дизайн', en: 'Design', canonical: 'Дизайн' },
  
  // Music & Performance
  { bg: 'Музика', en: 'Music', canonical: 'Музика' },
  { bg: 'Пеене', en: 'Singing', canonical: 'Пеене' },
  { bg: 'Китара', en: 'Guitar', canonical: 'Китара' },
  { bg: 'Пиано', en: 'Piano', canonical: 'Пиано' },
  { bg: 'Караоке', en: 'Karaoke', canonical: 'Караоке' },
  { bg: 'Театър', en: 'Theatre', canonical: 'Театър' },
  
  // Culture & Entertainment
  { bg: 'Кино', en: 'Cinema', canonical: 'Кино' },
  { bg: 'Музеи', en: 'Museums', canonical: 'Музеи' },
  { bg: 'Фолклор', en: 'Folklore', canonical: 'Фолклор' },
  { bg: 'Български традиции', en: 'Bulgarian Traditions', canonical: 'Български традиции' },
  { bg: 'Исторически места', en: 'Historical Sites', canonical: 'Исторически места' },
  
  // Food & Drink
  { bg: 'Готвене', en: 'Cooking', canonical: 'Готвене' },
  { bg: 'Кафе', en: 'Coffee', canonical: 'Кафе' },
  { bg: 'Пиво', en: 'Beer', canonical: 'Пиво' },
  { bg: 'Вино', en: 'Wine', canonical: 'Вино' },
  { bg: 'Дегустации', en: 'Tastings', canonical: 'Дегустации' },
  
  // Games & Social
  { bg: 'Настолни игри', en: 'Board Games', canonical: 'Настолни игри' },
  { bg: 'Игри на карти', en: 'Card Games', canonical: 'Игри на карти' },
  { bg: 'Белот', en: 'Belot', canonical: 'Белот' },
  { bg: 'Покер', en: 'Poker', canonical: 'Покер' },
  { bg: 'Видео игри', en: 'Video Games', canonical: 'Видео игри' },
  { bg: 'Гейминг', en: 'Gaming', canonical: 'Гейминг' },
  { bg: 'Нощен живот', en: 'Nightlife', canonical: 'Нощен живот' },
  
  // Travel & Places
  { bg: 'Пътувания', en: 'Travel', canonical: 'Пътувания' },
  { bg: 'Екскурзии', en: 'Excursions', canonical: 'Екскурзии' },
  { bg: 'Витоша', en: 'Vitosha', canonical: 'Витоша' },
  { bg: 'Рила', en: 'Rila', canonical: 'Рила' },
  { bg: 'Пирин', en: 'Pirin', canonical: 'Пирин' },
  { bg: 'Банско', en: 'Bansko', canonical: 'Банско' },
  { bg: 'Боровец', en: 'Borovets', canonical: 'Боровец' },
  { bg: 'Черноморие', en: 'Black Sea', canonical: 'Черноморие' },
  
  // Wellness & Health
  { bg: 'Медитация', en: 'Meditation', canonical: 'Медитация' },
  { bg: 'Спа', en: 'Spa', canonical: 'Спа' },
  { bg: 'Масаж', en: 'Massage', canonical: 'Масаж' },
  { bg: 'Минерални бани', en: 'Mineral Baths', canonical: 'Минерални бани' },
  { bg: 'Здравословен живот', en: 'Healthy Living', canonical: 'Здравословен живот' },
  { bg: 'Вегетарианство', en: 'Vegetarianism', canonical: 'Вегетарианство' },
  { bg: 'Веганство', en: 'Veganism', canonical: 'Веганство' },
  
  // Animals & Pets
  { bg: 'Кучета', en: 'Dogs', canonical: 'Кучета' },
  { bg: 'Котки', en: 'Cats', canonical: 'Котки' },
  { bg: 'Разходки с кучета', en: 'Dog Walking', canonical: 'Разходки с кучета' },
  { bg: 'Животни', en: 'Animals', canonical: 'Животни' },
  
  // Learning & Development
  { bg: 'Езици', en: 'Languages', canonical: 'Езици' },
  { bg: 'Английски', en: 'English', canonical: 'Английски' },
  { bg: 'Четене', en: 'Reading', canonical: 'Четене' },
  { bg: 'Писане', en: 'Writing', canonical: 'Писане' },
  
  // Tech & Innovation
  { bg: 'Програмиране', en: 'Programming', canonical: 'Програмиране' },
  { bg: 'Технологии', en: 'Technology', canonical: 'Технологии' },
  { bg: 'AI/ML', en: 'AI/ML', canonical: 'AI/ML' },
  { bg: 'Блокчейн', en: 'Blockchain', canonical: 'Блокчейн' },
  { bg: 'Крипто', en: 'Crypto', canonical: 'Крипто' },
  
  // Professional & Networking
  { bg: 'Предприемачество', en: 'Entrepreneurship', canonical: 'Предприемачество' },
  { bg: 'Стартъпи', en: 'Startups', canonical: 'Стартъпи' },
  { bg: 'Networking', en: 'Networking', canonical: 'Networking' },
  { bg: 'Доброволчество', en: 'Volunteering', canonical: 'Доброволчество' },
]

// Search helper - finds interest by either Bulgarian or English term
export function searchInterests(query: string): BilingualInterest[] {
  const q = query.toLowerCase()
  return BILINGUAL_INTERESTS.filter(
    interest =>
      interest.bg.toLowerCase().includes(q) ||
      interest.en.toLowerCase().includes(q)
  )
}

// Get display text for an interest based on language preference
export function getInterestDisplay(canonical: string, language: 'bg' | 'en' = 'bg'): string {
  const interest = BILINGUAL_INTERESTS.find(i => i.canonical === canonical)
  if (!interest) return canonical
  return language === 'en' ? interest.en : interest.bg
}
