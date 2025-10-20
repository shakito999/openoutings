-- Seed diverse events with interests
-- Make sure to replace 'YOUR_USER_ID' with an actual user ID from your profiles table

-- First, let's get some interest IDs (assumes interests table is populated)
-- You can find interest IDs by running: SELECT id, name FROM interests;

-- Example events with various interests

-- Hiking event
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Витоша Hiking Adventure',
  'Join us for a refreshing hike to Cherni Vrah, the highest peak of Vitosha! Bring water, snacks, and good vibes.',
  NOW() + INTERVAL '3 days',
  'Aleko hut, Vitosha Mountain',
  15,
  'YOUR_USER_ID'
) RETURNING id;

-- Skiing event
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Weekend Skiing in Bansko',
  'Hit the slopes this weekend! All skill levels welcome. Equipment rental info will be shared.',
  NOW() + INTERVAL '7 days',
  'Bansko Ski Resort',
  20,
  'YOUR_USER_ID'
);

-- Yoga & Meditation
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Sunrise Yoga in the Park',
  'Start your day with peaceful yoga and meditation in Borisova Gradina. Bring your mat!',
  NOW() + INTERVAL '2 days',
  'Borisova Gradina, Sofia',
  25,
  'YOUR_USER_ID'
);

-- Football
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Friendly Football Match',
  'Looking for players for a casual 5v5 match. All levels welcome!',
  NOW() + INTERVAL '4 days',
  'Studentski Grad Football Field',
  10,
  'YOUR_USER_ID'
);

-- Cooking & Wine Tasting
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Bulgarian Cuisine Cooking Class + Wine Tasting',
  'Learn to cook traditional Bulgarian dishes paired with local wines. A delicious evening awaits!',
  NOW() + INTERVAL '10 days',
  'Cooking Studio Sofia, Center',
  12,
  'YOUR_USER_ID'
);

-- Photography
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Street Photography Walk',
  'Explore Sofia''s hidden gems with your camera. Tips and tricks shared along the way!',
  NOW() + INTERVAL '5 days',
  'Meeting point: Serdika Metro Station',
  15,
  'YOUR_USER_ID'
);

-- Board Games
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Board Game Night',
  'Bring your favorite games or try new ones! Catan, Ticket to Ride, and more available.',
  NOW() + INTERVAL '1 day',
  'Board Game Café, Sofia Center',
  20,
  'YOUR_USER_ID'
);

-- Cycling
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Bike Tour: Sofia to Dragalevtsi',
  'Leisurely bike ride through scenic routes. ~20km. Bring your bike and helmet!',
  NOW() + INTERVAL '6 days',
  'Start: NDK, Sofia',
  12,
  'YOUR_USER_ID'
);

-- Music & Karaoke
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Karaoke Night Extravaganza',
  'Sing your heart out! All genres welcome. Let''s have a fun night with music!',
  NOW() + INTERVAL '8 days',
  'Karaoke Bar "The Stage", Sofia',
  25,
  'YOUR_USER_ID'
);

-- Technology & Startups
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Tech Meetup: AI & Machine Learning',
  'Discussion about latest trends in AI/ML. Network with fellow tech enthusiasts!',
  NOW() + INTERVAL '12 days',
  'SOHO Coworking Space, Sofia',
  30,
  'YOUR_USER_ID'
);

-- Coffee & Networking
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Coffee & Connections',
  'Casual morning coffee meetup for networking and making new friends.',
  NOW() + INTERVAL '2 days',
  'Café One More Bar, Sofia',
  15,
  'YOUR_USER_ID'
);

-- Dogs & Pet Walking
INSERT INTO events (title, description, starts_at, address, capacity, host_id)
VALUES (
  'Dog Walk Social',
  'Bring your furry friend for a social walk in the park! Let the pups make friends too.',
  NOW() + INTERVAL '3 days',
  'South Park (Yuzhen Park), Sofia',
  20,
  'YOUR_USER_ID'
);


-- After creating events, link them to interests
-- You'll need to:
-- 1. Get event IDs from the events you just created
-- 2. Get interest IDs from the interests table
-- 3. Insert into event_interests table

-- Example for linking (replace EVENT_ID and INTEREST_ID with actual values):
/*
-- Hiking event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Витоша Hiking Adventure'),
       id FROM interests WHERE name IN ('Планинарство', 'Витоша', 'Фотография');

-- Skiing event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Weekend Skiing in Bansko'),
       id FROM interests WHERE name IN ('Ски', 'Банско', 'Пътувания');

-- Yoga event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Sunrise Yoga in the Park'),
       id FROM interests WHERE name IN ('Йога', 'Медитация', 'Здравословен живот');

-- Football event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Friendly Football Match'),
       id FROM interests WHERE name IN ('Футбол');

-- Cooking event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Bulgarian Cuisine Cooking Class + Wine Tasting'),
       id FROM interests WHERE name IN ('Готвене', 'Вино', 'Дегустации', 'Български традиции');

-- Photography event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Street Photography Walk'),
       id FROM interests WHERE name IN ('Фотография', 'Изкуство');

-- Board games event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Board Game Night'),
       id FROM interests WHERE name IN ('Настолни игри');

-- Cycling event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Bike Tour: Sofia to Dragalevtsi'),
       id FROM interests WHERE name IN ('Колоездене', 'Витоша');

-- Karaoke event interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Karaoke Night Extravaganza'),
       id FROM interests WHERE name IN ('Караоке', 'Пеене', 'Музика', 'Нощен живот');

-- Tech meetup interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Tech Meetup: AI & Machine Learning'),
       id FROM interests WHERE name IN ('AI/ML', 'Технологии', 'Програмиране', 'Networking');

-- Coffee networking interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Coffee & Connections'),
       id FROM interests WHERE name IN ('Кафе', 'Networking');

-- Dog walk interests
INSERT INTO event_interests (event_id, interest_id)
SELECT (SELECT id FROM events WHERE title = 'Dog Walk Social'),
       id FROM interests WHERE name IN ('Кучета', 'Разходки с кучета', 'Животни');
*/
