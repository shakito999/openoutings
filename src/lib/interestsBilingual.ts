// Bilingual interests - each interest has Bulgarian and English versions
export interface BilingualInterest {
  bg: string
  en: string
  canonical: string // The primary version to store in DB
}

export const BILINGUAL_INTERESTS: BilingualInterest[] = [
  { bg: 'Планинарство', en: 'Hiking', canonical: 'Планинарство' },
  { bg: 'Trekking', en: 'Trekking', canonical: 'Trekking' },
  { bg: 'Къмпинг', en: 'Camping', canonical: 'Къмпинг' },
  { bg: 'Ски', en: 'Skiing', canonical: 'Ски' },
  { bg: 'Сноуборд', en: 'Snowboarding', canonical: 'Сноуборд' },
  { bg: 'Колоездене', en: 'Cycling', canonical: 'Колоездене' },
  { bg: 'Планинско колоездене', en: 'Mountain Biking', canonical: 'Планинско колоездене' },
  { bg: 'Бягане', en: 'Running', canonical: 'Бягане' },
  { bg: 'Йога', en: 'Yoga', canonical: 'Йога' },
  { bg: 'Катерене', en: 'Climbing', canonical: 'Катерене' },
  { bg: 'Парапланеризъм', en: 'Paragliding', canonical: 'Парапланеризъм' },
  { bg: 'Конна езда', en: 'Horse Riding', canonical: 'Конна езда' },
  { bg: 'Риболов', en: 'Fishing', canonical: 'Риболов' },
  { bg: 'Футбол', en: 'Football', canonical: 'Футбол' },
  { bg: 'Баскетбол', en: 'Basketball', canonical: 'Баскетбол' },
  { bg: 'Волейбол', en: 'Volleyball', canonical: 'Волейбол' },
  { bg: 'Тенис', en: 'Tennis', canonical: 'Тенис' },
  { bg: 'Бадминтон', en: 'Badminton', canonical: 'Бадминтон' },
  { bg: 'Плуване', en: 'Swimming', canonical: 'Плуване' },
  { bg: 'Фитнес', en: 'Fitness', canonical: 'Фитнес' },
  { bg: 'Кросфит', en: 'CrossFit', canonical: 'Кросфит' },
  { bg: 'Бойни изкуства', en: 'Martial Arts', canonical: 'Бойни изкуства' },
  { bg: 'Танци', en: 'Dancing', canonical: 'Танци' },
  { bg: 'Зумба', en: 'Zumba', canonical: 'Зумба' },
  { bg: 'Пилатес', en: 'Pilates', canonical: 'Пилатес' },
  { bg: 'Фотография', en: 'Photography', canonical: 'Фотография' },
  { bg: 'Живопис', en: 'Painting', canonical: 'Живопис' },
  { bg: 'Рисуване', en: 'Drawing', canonical: 'Рисуване' },
  { bg: 'Музика', en: 'Music', canonical: 'Музика' },
  { bg: 'Пеене', en: 'Singing', canonical: 'Пеене' },
  { bg: 'Китара', en: 'Guitar', canonical: 'Китара' },
  { bg: 'Пиано', en: 'Piano', canonical: 'Пиано' },
  { bg: 'Театър', en: 'Theatre', canonical: 'Театър' },
  { bg: 'Кино', en: 'Cinema', canonical: 'Кино' },
  { bg: 'Музеи', en: 'Museums', canonical: 'Музеи' },
  { bg: 'Изкуство', en: 'Art', canonical: 'Изкуство' },
  { bg: 'Ръкоделие', en: 'Crafts', canonical: 'Ръкоделие' },
  { bg: 'Готвене', en: 'Cooking', canonical: 'Готвене' },
  { bg: 'Кафе', en: 'Coffee', canonical: 'Кафе' },
  { bg: 'Пиво', en: 'Beer', canonical: 'Пиво' },
  { bg: 'Вино', en: 'Wine', canonical: 'Вино' },
  { bg: 'Дегустации', en: 'Tastings', canonical: 'Дегустации' },
  { bg: 'Настолни игри', en: 'Board Games', canonical: 'Настолни игри' },
  { bg: 'Видео игри', en: 'Video Games', canonical: 'Видео игри' },
  { bg: 'Покер', en: 'Poker', canonical: 'Покер' },
  { bg: 'Караоке', en: 'Karaoke', canonical: 'Караоке' },
  { bg: 'Нощен живот', en: 'Nightlife', canonical: 'Нощен живот' },
  { bg: 'Пътувания', en: 'Travel', canonical: 'Пътувания' },
  { bg: 'Екскурзии', en: 'Excursions', canonical: 'Екскурзии' },
  { bg: 'Езици', en: 'Languages', canonical: 'Езици' },
  { bg: 'Английски', en: 'English', canonical: 'Английски' },
  { bg: 'Програмиране', en: 'Programming', canonical: 'Програмиране' },
  { bg: 'Дизайн', en: 'Design', canonical: 'Дизайн' },
  { bg: 'Четене', en: 'Reading', canonical: 'Четене' },
  { bg: 'Писане', en: 'Writing', canonical: 'Писане' },
  { bg: 'Предприемачество', en: 'Entrepreneurship', canonical: 'Предприемачество' },
  { bg: 'Стартъпи', en: 'Startups', canonical: 'Стартъпи' },
  { bg: 'Networking', en: 'Networking', canonical: 'Networking' },
  { bg: 'Доброволчество', en: 'Volunteering', canonical: 'Доброволчество' },
  { bg: 'Витоша', en: 'Vitosha', canonical: 'Витоша' },
  { bg: 'Рила', en: 'Rila', canonical: 'Рила' },
  { bg: 'Пирин', en: 'Pirin', canonical: 'Пирин' },
  { bg: 'Банско', en: 'Bansko', canonical: 'Банско' },
  { bg: 'Боровец', en: 'Borovets', canonical: 'Боровец' },
  { bg: 'Черноморие', en: 'Black Sea', canonical: 'Черноморие' },
  { bg: 'Исторически места', en: 'Historical Sites', canonical: 'Исторически места' },
  { bg: 'Български традиции', en: 'Bulgarian Traditions', canonical: 'Български традиции' },
  { bg: 'Фолклор', en: 'Folklore', canonical: 'Фолклор' },
  { bg: 'Медитация', en: 'Meditation', canonical: 'Медитация' },
  { bg: 'Спа', en: 'Spa', canonical: 'Спа' },
  { bg: 'Масаж', en: 'Massage', canonical: 'Масаж' },
  { bg: 'Минерални бани', en: 'Mineral Baths', canonical: 'Минерални бани' },
  { bg: 'Здравословен живот', en: 'Healthy Living', canonical: 'Здравословен живот' },
  { bg: 'Вегетарианство', en: 'Vegetarianism', canonical: 'Вегетарианство' },
  { bg: 'Веганство', en: 'Veganism', canonical: 'Веганство' },
  { bg: 'Кучета', en: 'Dogs', canonical: 'Кучета' },
  { bg: 'Котки', en: 'Cats', canonical: 'Котки' },
  { bg: 'Разходки с кучета', en: 'Dog Walking', canonical: 'Разходки с кучета' },
  { bg: 'Животни', en: 'Animals', canonical: 'Животни' },
  { bg: 'Технологии', en: 'Technology', canonical: 'Технологии' },
  { bg: 'AI/ML', en: 'AI/ML', canonical: 'AI/ML' },
  { bg: 'Блокчейн', en: 'Blockchain', canonical: 'Блокчейн' },
  { bg: 'Крипто', en: 'Crypto', canonical: 'Крипто' },
  { bg: 'Гейминг', en: 'Gaming', canonical: 'Гейминг' },
  { bg: 'Фотография с дрон', en: 'Drone Photography', canonical: 'Фотография с дрон' },
]

// Get all unique canonical interests for display
export const INTERESTS = BILINGUAL_INTERESTS.map(i => i.canonical)

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
