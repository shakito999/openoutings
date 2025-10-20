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

const users = [
  { email: 'georgi.ivanov@example.bg', password: 'Passw0rd!georgi', full_name: 'Георги Иванов', username: 'georgi_iv' },
  { email: 'maria.petrova@example.bg', password: 'Passw0rd!maria', full_name: 'Мария Петрова', username: 'maria_p' },
  { email: 'dimitar.dimitrov@example.bg', password: 'Passw0rd!dimitar', full_name: 'Димитър Димитров', username: 'mitko' },
  { email: 'elena.stoyanova@example.bg', password: 'Passw0rd!elena', full_name: 'Елена Стоянова', username: 'elena_s' },
  { email: 'ivan.georgiev@example.bg', password: 'Passw0rd!ivan', full_name: 'Иван Георгиев', username: 'vanko' },
  { email: 'ana.nikolova@example.bg', password: 'Passw0rd!ana', full_name: 'Ана Николова', username: 'ana_n' },
  { email: 'stefan.popov@example.bg', password: 'Passw0rd!stefan', full_name: 'Стефан Попов', username: 'stefan_p' },
  { email: 'victoria.todorova@example.bg', password: 'Passw0rd!vicky', full_name: 'Виктория Тодорова', username: 'vicky_t' },
]

const interests = [
  'Планинарство','Trekking','Къмпинг','Ски','Сноуборд','Колоездене','Планинско колоездене','Бягане','Йога','Катерене',
  'Футбол','Баскетбол','Волейбол','Тенис','Бадминтон','Плуване','Фитнес','Танци','Фотография','Живопис',
  'Музика','Театър','Кино','Музеи','Готвене','Кафе','Пиво','Вино','Настолни игри','Видео игри','Караоке',
  'Езици','Английски','Програмиране','Дизайн','Четене','Витоша','Рила','Пирин','Технологии'
]

function daysFromNow(n){ const d = new Date(); d.setDate(d.getDate()+n); return d }

async function ensureUsers(){
  const results = []
  for (const u of users){
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, username: u.username }
    })
    if (error && !String(error.message||'').includes('already registered')){
      throw error
    }
    const user = data?.user
    if (!user){
      // fetch by email if already exists
      const { data: list } = await supabase.auth.admin.listUsers()
      const found = list?.users?.find(x=>x.email===u.email)
      if (!found) throw new Error('Could not find or create user: '+u.email)
      results.push({ id: found.id, ...u })
    } else {
      results.push({ id: user.id, ...u })
    }
  }
  return results
}

async function upsertProfiles(created){
  for (const u of created){
    await supabase.from('profiles').upsert({ id: u.id, username: u.username, full_name: u.full_name, avatar_url: null })
  }
}

async function upsertInterests(){
  for (const name of interests){
    await supabase.from('interests').upsert({ name })
  }
}

async function getInterestIds(names){
  const { data } = await supabase.from('interests').select('id,name').in('name', names)
  const byName = new Map((data||[]).map(r=>[r.name, r.id]))
  return names.map(n=>byName.get(n)).filter(Boolean)
}

async function seedEvents(users){
  const evts = [
    { host: users[0], title:'Изкачване на връх Черни връх - Витоша', description:'Приятно 7км изкачване с кафе на връх Алеко след това. Подходящо за всички нива.', starts_at: daysFromNow(2), capacity:12, gender:'none', address:'Драгалевци, София', lat:42.5833, lng:23.2667, image:'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', tags:['Планинарство','Кафе','Витоша'] },
    { host: users[1], title:'Настолни игри в Board Game Bar', description:'Catan, Wingspan и още много игри. Забавна вечер с приятели!', starts_at: daysFromNow(3), capacity:8, gender:'none', address:'ул. Раковски 108, София', lat:42.6977, lng:23.3219, image:'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800', tags:['Настолни игри','Кафе'] },
    { host: users[2], title:'Сутрешно бягане в Борисовата градина', description:'10км леко темпо, всички нива са добре дошли. Старт от Орлов мост.', starts_at: daysFromNow(1), capacity:15, gender:'none', address:'Борисова градина, София', lat:42.6730, lng:23.3460, image:'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', tags:['Бягане','Фитнес'] },
    { host: users[3], title:'Фотографска разходка в Стария град', description:'Ще обиколим най-красивите места в центъра - Александър Невски, Жълтите павета, Ларгото.', starts_at: daysFromNow(4), capacity:10, gender:'none', address:'пл. Александър Невски, София', lat:42.6959, lng:23.3330, image:'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800', tags:['Фотография','Музеи'] },
    { host: users[4], title:'Уикенд ски приключение в Боровец', description:'Два дни ски в Боровец с нощувка. Всички нива са добре дошли, имаме инструктор.', starts_at: daysFromNow(7), capacity:20, gender:'none', address:'Боровец, Рила', lat:42.2631, lng:23.5978, image:'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', tags:['Ски','Рила','Боровец'] },
    { host: users[5], title:'Йога в парка', description:'Сутрешна йога сесия на открито в Южния парк. Донесете си постелка.', starts_at: daysFromNow(2), capacity:20, gender:'none', address:'Южен парк, София', lat:42.6730, lng:23.3180, image:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', tags:['Йога','Фитнес'] },
    { host: users[6], title:'Дегустация на крафт бира', description:'Опитваме най-добрите български крафт бири в Kanaal Beer Bar.', starts_at: daysFromNow(5), capacity:12, gender:'none', address:'ул. Неофит Рилски 12, София', lat:42.6941, lng:23.3225, image:'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800', tags:['Пиво','Дегустации'] },
    { host: users[7], title:'Startup Meetup Sofia', description:'Networking събитие за предприемачи и стартъпи. Keynote speaker от успешен български стартъп.', starts_at: daysFromNow(6), capacity:50, gender:'none', address:'SOHO, ул. Цар Самуил 29, София', lat:42.6977, lng:23.3219, image:'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', tags:['Стартъпи','Networking','Предприемачество'] },
    { host: users[0], title:'Катерене в SofiClimb', description:'Въвеждащо занятие по катерене за начинаещи. Екипировка се предоставя.', starts_at: daysFromNow(3), capacity:10, gender:'none', address:'SofiClimb, бул. Цариградско шосе, София', lat:42.6589, lng:23.3765, image:'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800', tags:['Катерене','Фитнес'] },
    { host: users[1], title:'Готварски курс - Традиционна българска кухня', description:'Учим се да готвим баница, сарми и таратор. Всички съставки са осигурени.', starts_at: daysFromNow(8), capacity:8, gender:'none', address:'Culinary Studio, ул. Солунска 34, София', lat:42.6930, lng:23.3190, image:'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800', tags:['Готвене','Български традиции'] },
    { host: users[2], title:'Концерт в НДК', description:'Симфоничен концерт с произведения на Вивалди и Бах.', starts_at: daysFromNow(9), capacity:30, gender:'none', address:'НДК, пл. България 1, София', lat:42.6847, lng:23.3190, image:'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800', tags:['Музика','Театър','Кино'] },
    { host: users[3], title:'Планинско колоездене в Витоша', description:'25км трасе с умерена трудност. Необходимо е собствено колело и екипировка.', starts_at: daysFromNow(4), capacity:10, gender:'none', address:'Златните мостове, Витоша', lat:42.6333, lng:23.2667, image:'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', tags:['Планинско колоездене','Колоездене','Витоша'] },
    { host: users[4], title:'Караоке вечер в The Box', description:'Пеем любимите си песни и се забавляваме. Първа напитка безплатна!', starts_at: daysFromNow(2), capacity:25, gender:'none', address:'The Box Karaoke, ул. Витоша 32, София', lat:42.6930, lng:23.3190, image:'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', tags:['Караоке','Нощен живот','Пеене'] },
    { host: users[5], title:'Волейбол на плажа', description:'Приятелски турнир по плажен волейбол в Beach Arena Sofia.', starts_at: daysFromNow(5), capacity:16, gender:'none', address:'Beach Arena Sofia, Околовръстен път', lat:42.6850, lng:23.2900, image:'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800', tags:['Волейбол','Фитнес'] },
    { host: users[6], title:'Посещение в Национална художествена галерия', description:'Разглеждаме най-новата изложба с български художници и след това кафе.', starts_at: daysFromNow(6), capacity:12, gender:'none', address:'Национална художествена галерия, пл. Александър Батенберг 1', lat:42.6959, lng:23.3240, image:'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800', tags:['Музеи','Изкуство','Кафе'] },
  ]
  for (const e of evts){
    const { data, error } = await supabase.from('events').insert({
      host_id: e.host.id,
      title: e.title,
      description: e.description,
      starts_at: e.starts_at.toISOString(),
      capacity: e.capacity,
      gender: e.gender,
      address: e.address,
      lat: e.lat,
      lng: e.lng,
    }).select('id').single()
    if (error && !String(error.message||'').includes('duplicate')) throw error
    if (data?.id && e.image) {
      await supabase.from('event_photos').upsert({
        event_id: data.id,
        storage_path: e.image
      })
    }
  }
}

async function seedPoll(){
  const title = 'Weekend Availability'
  const slug = 'weekend'
  const start = daysFromNow(7)
  const end = daysFromNow(10)
  await supabase.from('availability_polls').upsert({
    title,
    slug,
    starts_on: start.toISOString().slice(0,10),
    ends_on: end.toISOString().slice(0,10),
  })
}

async function seed(){
  console.log('Seeding users...')
  const created = await ensureUsers()
  console.log('Upserting profiles...')
  await upsertProfiles(created)
  console.log('Upserting interests...')
  await upsertInterests()
  console.log('Seeding events...')
  await seedEvents(created)
  console.log('Seeding poll...')
  await seedPoll()
  console.log('Done.')
}

seed().catch(e=>{ console.error(e); process.exit(1) })
