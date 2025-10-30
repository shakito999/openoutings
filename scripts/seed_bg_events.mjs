import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load env from .env.local (fallback to .env)
loadEnv({ path: existsSync('.env.local') ? '.env.local' : '.env' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, service)

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}
function atTime(date, h, m = 0) {
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}
function plusHours(date, hours) {
  const d = new Date(date)
  d.setHours(d.getHours() + hours)
  return d
}

async function getAnyHostId() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
  if (error) throw error
  return data?.id || null
}

async function seedBgEvents() {
  const hostId = await getAnyHostId()

  const sofia = [
    {
      title: 'Сутрешно кафе в Градинката Кристал',
      description: 'Неформална среща за запознанства и разговори на открито. Кучета са добре дошли.',
      starts_at: atTime(daysFromNow(1), 9, 0),
      ends_at: atTime(daysFromNow(1), 10, 0),
      capacity: 15,
      gender: 'none',
      address: 'Градинката Кристал, София',
      lat: 42.6948,
      lng: 23.3329,
      is_paid: false,
      price_cents: null,
      tips: 'Вземете вода и усмивки :)',
      difficulty: 'beginner',
    },
    {
      title: 'Стрийт фотография около Сердика',
      description: 'Разходка с фотоапарати из центъра – Ларгото, Сердика, бул. Витоша.',
      starts_at: atTime(daysFromNow(2), 17, 0),
      ends_at: atTime(daysFromNow(2), 19, 0),
      capacity: 12,
      gender: 'none',
      address: 'Метростанция Сердика, София',
      lat: 42.6977,
      lng: 23.3219,
      is_paid: false,
      price_cents: null,
      tips: 'Заредете батериите и освободете памет.',
      difficulty: 'easy',
    },
    {
      title: 'Йога в Южния парк',
      description: 'Сутрешна йога сесия на тревата. Подходяща за всички нива.',
      starts_at: atTime(daysFromNow(2), 8, 0),
      ends_at: atTime(daysFromNow(2), 9, 0),
      capacity: 25,
      gender: 'none',
      address: 'Южен парк, вход от бул. Гоце Делчев, София',
      lat: 42.6670,
      lng: 23.3190,
      is_paid: false,
      price_cents: null,
      tips: 'Донесете постелка.',
      difficulty: 'beginner',
    },
    {
      title: 'Бордови игри на Раковски',
      description: 'Вечер с любими настолни игри – Catan, Azul, Wingspan и още.',
      starts_at: atTime(daysFromNow(3), 19, 0),
      ends_at: atTime(daysFromNow(3), 22, 0),
      capacity: 16,
      gender: 'none',
      address: 'ул. Георги С. Раковски 108, София',
      lat: 42.6956,
      lng: 23.3234,
      is_paid: true,
      price_cents: 1000,
      tips: 'Имат местни напитки и леки хапки.',
      difficulty: 'beginner',
    },
    {
      title: 'Караоке на Витошка',
      description: 'Забавна караоке вечер с любими хитове. Микрофонът е твой!',
      starts_at: atTime(daysFromNow(4), 20, 0),
      ends_at: atTime(daysFromNow(4), 23, 0),
      capacity: 25,
      gender: 'none',
      address: 'бул. Витоша 32, София',
      lat: 42.6868,
      lng: 23.3193,
      is_paid: true,
      price_cents: 1500,
      tips: 'Резервираме маса, ела навреме.',
      difficulty: 'beginner',
    },
    {
      title: 'Изкачване на Черни връх',
      description: 'Класически маршрут от Алеко до Черни връх и обратно. Умерено темпо.',
      starts_at: atTime(daysFromNow(5), 8, 30),
      ends_at: atTime(daysFromNow(5), 14, 30),
      capacity: 20,
      gender: 'none',
      address: 'хижа Алеко, Витоша',
      lat: 42.6050,
      lng: 23.3177,
      is_paid: false,
      price_cents: null,
      tips: 'Топли дрехи, вода и сандвич.',
      difficulty: 'moderate',
    },
    {
      title: 'Networking в Sofia Tech Park',
      description: 'Среща на предприемачи и тех ентусиасти. Кратки светкавични представяния.',
      starts_at: atTime(daysFromNow(6), 18, 30),
      ends_at: atTime(daysFromNow(6), 20, 30),
      capacity: 60,
      gender: 'none',
      address: 'Sofia Tech Park, Incubator, София',
      lat: 42.6594,
      lng: 23.3832,
      is_paid: false,
      price_cents: null,
      tips: 'Носете визитки.',
      difficulty: 'beginner',
    },
    {
      title: 'Концерт в НДК',
      description: 'Класическа музика – Бах и Вивалди. Зала 1.',
      starts_at: atTime(daysFromNow(7), 19, 30),
      ends_at: atTime(daysFromNow(7), 21, 30),
      capacity: 60,
      gender: 'none',
      address: 'НДК, пл. България 1, София',
      lat: 42.6847,
      lng: 23.3190,
      is_paid: true,
      price_cents: 3000,
      tips: 'Официално облекло по желание.',
      difficulty: 'beginner',
    },
    {
      title: 'Плажен волейбол в Beach Arena',
      description: 'Приятелски мачове на пясък. Ще направим смесени отбори.',
      starts_at: atTime(daysFromNow(3), 18, 0),
      ends_at: atTime(daysFromNow(3), 20, 0),
      capacity: 16,
      gender: 'none',
      address: 'Beach Arena Sofia, Околовръстен път',
      lat: 42.6850,
      lng: 23.2900,
      is_paid: false,
      price_cents: null,
      tips: 'Кърпа и вода.',
      difficulty: 'easy',
    },
    {
      title: 'Кино вечер в Дом на киното',
      description: 'Независимо европейско кино и дискусия след прожекцията.',
      starts_at: atTime(daysFromNow(4), 19, 0),
      ends_at: atTime(daysFromNow(4), 21, 0),
      capacity: 40,
      gender: 'none',
      address: 'Дом на киното, ул. Екзарх Йосиф 37, София',
      lat: 42.6930,
      lng: 23.3205,
      is_paid: true,
      price_cents: 1200,
      tips: 'Билети на място.',
      difficulty: 'beginner',
    },
  ]

  const momchilgrad = [
    {
      title: 'Кафе среща в центъра на Момчилград',
      description: 'Запознанства и разговори – неформална сутрешна среща.',
      starts_at: atTime(daysFromNow(1), 10, 0),
      ends_at: atTime(daysFromNow(1), 11, 30),
      capacity: 12,
      gender: 'none',
      address: 'Централен площад, Момчилград',
      lat: 41.5274,
      lng: 25.4119,
      is_paid: false,
      price_cents: null,
      tips: 'Вземете дребни за кафе.',
      difficulty: 'beginner',
    },
    {
      title: 'Йога в градския парк – Момчилград',
      description: 'Лека йога сесия на открито. Подходяща за начинаещи.',
      starts_at: atTime(daysFromNow(2), 8, 30),
      ends_at: atTime(daysFromNow(2), 9, 30),
      capacity: 20,
      gender: 'none',
      address: 'Градски парк, Момчилград',
      lat: 41.5305,
      lng: 25.4163,
      is_paid: false,
      price_cents: null,
      tips: 'Донесете постелка и вода.',
      difficulty: 'easy',
    },
    {
      title: 'Разходка до светилището Татул',
      description: 'Кратка екскурзия до тракийското светилище. Тръгване с коли.',
      starts_at: atTime(daysFromNow(3), 9, 0),
      ends_at: atTime(daysFromNow(3), 13, 0),
      capacity: 15,
      gender: 'none',
      address: 'Светилище Татул, с. Татул',
      lat: 41.5407,
      lng: 25.4338,
      is_paid: false,
      price_cents: null,
      tips: 'Удобни обувки и шапка.',
      difficulty: 'moderate',
    },
    {
      title: 'Пикник край язовир Студен кладенец',
      description: 'Пикник с гледка към язовира. Ще организираме споделена храна.',
      starts_at: atTime(daysFromNow(4), 12, 0),
      ends_at: atTime(daysFromNow(4), 15, 0),
      capacity: 18,
      gender: 'none',
      address: 'Яз. Студен кладенец, район с. Птичар',
      lat: 41.4867,
      lng: 25.3875,
      is_paid: false,
      price_cents: null,
      tips: 'Одеяло за сядане и слънцезащита.',
      difficulty: 'easy',
    },
    {
      title: 'Фотосесия при Каменните гъби',
      description: 'Снимаме уникалните скални образувания до с. Бели пласт.',
      starts_at: atTime(daysFromNow(5), 17, 0),
      ends_at: atTime(daysFromNow(5), 19, 0),
      capacity: 12,
      gender: 'none',
      address: 'Каменните гъби, с. Бели пласт',
      lat: 41.6490,
      lng: 25.4726,
      is_paid: false,
      price_cents: null,
      tips: 'Широкоъгълен обектив е плюс.',
      difficulty: 'intermediate',
    },
    {
      title: 'Нощно наблюдение на звезди край Нановица',
      description: 'Астро-вечер с любителски телескопи извън града.',
      starts_at: atTime(daysFromNow(6), 21, 0),
      ends_at: atTime(daysFromNow(6), 23, 0),
      capacity: 20,
      gender: 'none',
      address: 'Край с. Нановица, Момчилград',
      lat: 41.5180,
      lng: 25.3560,
      is_paid: false,
      price_cents: null,
      tips: 'Топли дрехи и челник.',
      difficulty: 'beginner',
    },
    {
      title: 'Футбол на градския стадион – Момчилград',
      description: '5v5 мач, всички нива са добре дошли.',
      starts_at: atTime(daysFromNow(2), 18, 0),
      ends_at: atTime(daysFromNow(2), 19, 30),
      capacity: 10,
      gender: 'none',
      address: 'Градски стадион, Момчилград',
      lat: 41.5254,
      lng: 25.4140,
      is_paid: false,
      price_cents: null,
      tips: 'Моля, донесете спортни обувки.',
      difficulty: 'easy',
    },
    {
      title: 'Работилница за баница',
      description: 'Ще направим традиционна родопска баница. Всички продукти са осигурени.',
      starts_at: atTime(daysFromNow(7), 17, 30),
      ends_at: atTime(daysFromNow(7), 19, 0),
      capacity: 8,
      gender: 'none',
      address: "Пекарна 'Родопско тесто', ул. Дружба 1, Момчилград",
      lat: 41.5262,
      lng: 25.4130,
      is_paid: true,
      price_cents: 1500,
      tips: 'Престилки ще бъдат предоставени.',
      difficulty: 'beginner',
    },
    {
      title: 'Колоездачна разходка до Татул',
      description: 'Маршрут Момчилград – Татул – Момчилград. ~28 км.',
      starts_at: atTime(daysFromNow(3), 17, 30),
      ends_at: atTime(daysFromNow(3), 20, 0),
      capacity: 14,
      gender: 'none',
      address: 'Старт: Център Момчилград',
      lat: 41.5274,
      lng: 25.4119,
      is_paid: false,
      price_cents: null,
      tips: 'Каска задължителна, светлини препоръчителни.',
      difficulty: 'intermediate',
    },
    {
      title: 'Народни танци в читалището',
      description: 'Вечер на българските хора – подходящо за начинаещи.',
      starts_at: atTime(daysFromNow(5), 19, 0),
      ends_at: atTime(daysFromNow(5), 20, 30),
      capacity: 20,
      gender: 'none',
      address: "НЧ 'Нов Живот', Момчилград",
      lat: 41.5280,
      lng: 25.4100,
      is_paid: true,
      price_cents: 500,
      tips: 'Удобни обувки.',
      difficulty: 'beginner',
    },
  ]

  const all = [...momchilgrad, ...sofia]

  // Optional: remove exact-title duplicates to keep seed idempotent-ish
  const titles = all.map(e => e.title)
  await supabase.from('events').delete().in('title', titles)

  const rows = all.map(e => ({
    host_id: hostId,
    title: e.title,
    description: e.description,
    starts_at: e.starts_at.toISOString(),
    ends_at: e.ends_at ? e.ends_at.toISOString() : null,
    capacity: e.capacity,
    gender: e.gender,
    address: e.address,
    lat: e.lat,
    lng: e.lng,
    is_paid: e.is_paid,
    price_cents: e.price_cents,
    tips: e.tips,
    difficulty: e.difficulty,
  }))

  const { data, error } = await supabase.from('events').insert(rows).select('id,title')
  if (error) throw error
  console.log(`Inserted ${data?.length || 0} events.`)
}

seedBgEvents().catch((e) => {
  console.error(e)
  process.exit(1)
})
