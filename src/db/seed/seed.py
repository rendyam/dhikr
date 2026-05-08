#!/usr/bin/env python3
"""
Python seed script for adhkar.db.
Generates the same database as seed.ts but uses Python's built-in sqlite3.
Run: python3 src/db/seed/seed.py
"""
import sqlite3, json, os

OUTPUT = os.path.join(os.path.dirname(__file__), 'adhkar.db')
if os.path.exists(OUTPUT):
    os.remove(OUTPUT)

con = sqlite3.connect(OUTPUT)
cur = con.cursor()
cur.executescript("""
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE categories (
  id          INTEGER PRIMARY KEY,
  slug        TEXT    NOT NULL UNIQUE,
  name_ar     TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE category_translations (
  category_id INTEGER NOT NULL REFERENCES categories(id),
  locale      TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  PRIMARY KEY (category_id, locale)
);

CREATE TABLE dhikr (
  id                  INTEGER PRIMARY KEY,
  arabic_text         TEXT    NOT NULL,
  transliteration     TEXT,
  repetition_count    INTEGER,
  source_type         TEXT    NOT NULL CHECK(source_type IN ('quran','hadith')),
  surah_name          TEXT,
  ayah_number         INTEGER,
  collection_name     TEXT,
  book_number         TEXT,
  hadith_number       TEXT,
  authenticity_grade  TEXT    NOT NULL CHECK(authenticity_grade IN ('sahih','hasan')),
  scholar_names       TEXT,
  grading_rationale   TEXT,
  full_hadith_text    TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE dhikr_translations (
  dhikr_id    INTEGER NOT NULL REFERENCES dhikr(id),
  locale      TEXT    NOT NULL,
  translation TEXT    NOT NULL,
  PRIMARY KEY (dhikr_id, locale)
);

CREATE TABLE category_dhikr (
  category_id INTEGER NOT NULL REFERENCES categories(id),
  dhikr_id    INTEGER NOT NULL REFERENCES dhikr(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, dhikr_id)
);

CREATE VIRTUAL TABLE dhikr_fts USING fts5(
  dhikr_id UNINDEXED,
  arabic_text,
  transliteration,
  content='dhikr',
  content_rowid='id'
);
""")

def cat(id, slug, name_ar, sort_order, name_en, name_id):
    cur.execute("INSERT INTO categories VALUES (?,?,?,?)", (id, slug, name_ar, sort_order))
    cur.execute("INSERT INTO category_translations VALUES (?,?,?)", (id, 'en', name_en))
    cur.execute("INSERT INTO category_translations VALUES (?,?,?)", (id, 'id', name_id))

def dhikr(id, arabic, translit, reps, src_type, surah, ayah, coll, book, hadith_no,
          grade, scholars, rationale, full_text, sort_order, tr_en, tr_id):
    cur.execute("""INSERT INTO dhikr VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (id, arabic, translit, reps, src_type, surah, ayah, coll, book, hadith_no,
         grade, json.dumps(scholars), rationale, full_text, sort_order))
    cur.execute("INSERT INTO dhikr_translations VALUES (?,?,?)", (id, 'en', tr_en))
    cur.execute("INSERT INTO dhikr_translations VALUES (?,?,?)", (id, 'id', tr_id))

def link(cat_id, dhikr_id, sort_order):
    cur.execute("INSERT INTO category_dhikr VALUES (?,?,?)", (cat_id, dhikr_id, sort_order))

# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
cat(1,'morning',       'أذكار الصباح',           1,'Morning Adhkar',       'Dzikir Pagi')
cat(2,'evening',       'أذكار المساء',            2,'Evening Adhkar',       'Dzikir Petang')
cat(3,'after-prayer',  'أذكار بعد الصلاة',        3,'After Prayer Adhkar',  'Dzikir Setelah Shalat')
cat(4,'before-sleep',  'أذكار النوم',             4,'Before Sleep Adhkar',  'Dzikir Sebelum Tidur')
cat(5,'waking-up',     'أذكار الاستيقاظ',         5,'Waking Up Adhkar',     'Dzikir Bangun Tidur')
cat(6,'entering-home', 'أذكار دخول المنزل',       6,'Entering Home',        'Dzikir Masuk Rumah')
cat(7,'leaving-home',  'أذكار الخروج من المنزل',  7,'Leaving Home',         'Dzikir Keluar Rumah')
cat(8,'eating',        'أذكار الطعام',            8,'Eating Adhkar',        'Dzikir Makan')
cat(9,'general',       'الذكر العام',             9,'General Remembrance',  'Dzikir Umum')


# ---------------------------------------------------------------------------
# Category 1 — Morning Adhkar
# ---------------------------------------------------------------------------
dhikr(1,
  'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  "Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa 'ala kulli shay'in qadir",
  1,'hadith',None,None,'Abu Dawud','4','5076','sahih',
  ['Al-Albani'],'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "The Prophet ﷺ said: 'Whoever says in the morning: We have reached the morning and the whole kingdom belongs to Allah...' (Abu Dawud 5076)",
  1,
  'We have reached the morning and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
  'Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.')
link(1,1,1)

dhikr(2,
  'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
  "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur",
  1,'hadith',None,None,'At-Tirmidhi','5','3391','hasan',
  ['At-Tirmidhi','Al-Albani'],'Graded Hasan by At-Tirmidhi and authenticated by Al-Albani',
  "The Prophet ﷺ used to say in the morning: 'O Allah, by You we enter the morning...' (At-Tirmidhi 3391)",
  2,
  'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.',
  'Ya Allah, dengan-Mu kami memasuki waktu pagi dan dengan-Mu kami memasuki waktu petang, dengan-Mu kami hidup dan dengan-Mu kami mati, dan kepada-Mu kebangkitan.')
link(1,2,2)

dhikr(3,
  'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfir li fa'innahu la yaghfirudh-dhunuba illa ant",
  1,'hadith',None,None,'Al-Bukhari','80','6306','sahih',
  ['Al-Bukhari'],'Reported in Sahih Al-Bukhari — the highest level of authenticity',
  "The Prophet ﷺ said: 'The master of seeking forgiveness is to say: O Allah, You are my Lord, none has the right to be worshipped except You...' (Al-Bukhari 6306)",
  3,
  'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none forgives sins except You.',
  'Ya Allah, Engkau adalah Rabbku, tidak ada ilah yang berhak disembah kecuali Engkau. Engkau telah menciptakanku dan aku adalah hamba-Mu. Aku berada di atas perjanjian dan janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan apa yang aku perbuat. Aku mengakui nikmat-Mu atasku dan aku mengakui dosaku, maka ampunilah aku, karena sesungguhnya tidak ada yang mengampuni dosa-dosa kecuali Engkau.')
link(1,3,3)

dhikr(4,
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  'Subhanallahi wa bihamdih',
  100,'hadith',None,None,'Al-Bukhari','80','6405','sahih',
  ['Al-Bukhari','Muslim'],'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  "The Prophet ﷺ said: 'Whoever says Glory be to Allah and His is the praise one hundred times in the morning and evening...' (Al-Bukhari 6405)",
  4,
  'Glory be to Allah and His is the praise.',
  'Maha Suci Allah dan segala puji bagi-Nya.')
link(1,4,4)

dhikr(5,
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
  "Allahumma inni as'alukal-'afwa wal-'afiyata fid-dunya wal-akhirah",
  1,'hadith',None,None,'Abu Dawud','4','5074','sahih',
  ['Al-Albani','Ibn Hajar'],'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "Ibn Umar reported that the Messenger of Allah ﷺ never failed to say these words in the morning and evening: 'O Allah, I ask You for pardon and well-being in this world and the Hereafter.' (Abu Dawud 5074)",
  5,
  'O Allah, I ask You for pardon and well-being in this world and the Hereafter.',
  'Ya Allah, sesungguhnya aku memohon kepada-Mu maaf dan keselamatan di dunia dan akhirat.')
link(1,5,5)


# ---------------------------------------------------------------------------
# Category 2 — Evening Adhkar
# ---------------------------------------------------------------------------
dhikr(6,
  'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  "Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa 'ala kulli shay'in qadir",
  1,'hadith',None,None,'Abu Dawud','4','5076','sahih',
  ['Al-Albani'],'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "The Prophet ﷺ said: 'Whoever says in the evening: We have reached the evening and the whole kingdom belongs to Allah...' (Abu Dawud 5076)",
  1,
  'We have reached the evening and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
  'Kami telah memasuki waktu petang dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.')
link(2,6,1)

dhikr(7,
  'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
  "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir",
  1,'hadith',None,None,'At-Tirmidhi','5','3391','hasan',
  ['At-Tirmidhi','Al-Albani'],'Graded Hasan by At-Tirmidhi and authenticated by Al-Albani',
  "The Prophet ﷺ used to say in the evening: 'O Allah, by You we enter the evening...' (At-Tirmidhi 3391)",
  2,
  'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.',
  'Ya Allah, dengan-Mu kami memasuki waktu petang dan dengan-Mu kami memasuki waktu pagi, dengan-Mu kami hidup dan dengan-Mu kami mati, dan kepada-Mu tempat kembali.')
link(2,7,2)

dhikr(8,
  'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
  "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
  3,'hadith',None,None,'Muslim','35','2709','sahih',
  ['Muslim'],'Reported in Sahih Muslim',
  "The Prophet ﷺ said: 'Whoever says in the evening three times: I seek refuge in the perfect words of Allah from the evil of what He has created, no harm will afflict him that night.' (Muslim 2709)",
  3,
  'I seek refuge in the perfect words of Allah from the evil of what He has created.',
  'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan apa yang Dia ciptakan.')
link(2,8,3)

dhikr(9,
  'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
  "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa ant",
  3,'hadith',None,None,'Abu Dawud','4','5090','hasan',
  ['Al-Albani'],'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  "Abu Bakr As-Siddiq reported that the Messenger of Allah ﷺ taught him to say in the morning and evening: 'O Allah, grant me health in my body...' (Abu Dawud 5090)",
  4,
  'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. None has the right to be worshipped except You.',
  'Ya Allah, berikanlah kesehatan pada tubuhku. Ya Allah, berikanlah kesehatan pada pendengaranku. Ya Allah, berikanlah kesehatan pada penglihatanku. Tidak ada ilah yang berhak disembah kecuali Engkau.')
link(2,9,4)

dhikr(10,
  'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
  "Hasbiyallahu la ilaha illa huwa 'alayhi tawakkaltu wa huwa rabbul-'arshil-'azim",
  7,'hadith',None,None,'Abu Dawud','4','5081','hasan',
  ['Al-Albani','Ibn As-Sunni'],'Graded Hasan by Al-Albani',
  "The Prophet ﷺ said: 'Whoever says seven times in the morning and evening: Allah is sufficient for me, none has the right to be worshipped except Him...' (Abu Dawud 5081)",
  5,
  'Allah is sufficient for me. None has the right to be worshipped except Him. Upon Him I rely and He is the Lord of the Magnificent Throne.',
  'Cukuplah Allah bagiku. Tidak ada ilah yang berhak disembah kecuali Dia. Kepada-Nya aku bertawakal dan Dia adalah Rabb Arsy yang agung.')
link(2,10,5)


# ---------------------------------------------------------------------------
# Category 3 — After Prayer Adhkar
# ---------------------------------------------------------------------------
dhikr(11,'أَسْتَغْفِرُ اللَّهَ','Astaghfirullah',
  3,'hadith',None,None,'Muslim','4','591','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Thawban reported: When the Messenger of Allah ﷺ finished his prayer, he would seek forgiveness three times... (Muslim 591)",
  1,'I seek forgiveness from Allah.','Aku memohon ampun kepada Allah.')
link(3,11,1)

dhikr(12,
  'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
  "Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
  1,'hadith',None,None,'Muslim','4','591','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Thawban reported: When the Messenger of Allah ﷺ finished his prayer, he would say: 'O Allah, You are Peace and from You is peace...' (Muslim 591)",
  2,
  'O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of majesty and honour.',
  'Ya Allah, Engkau adalah As-Salam (Yang Maha Sejahtera) dan dari-Mu keselamatan. Maha Berkah Engkau wahai Dzat Yang Maha Agung dan Maha Mulia.')
link(3,12,2)

dhikr(13,
  'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  "La ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa 'ala kulli shay'in qadir",
  1,'hadith',None,None,'Muslim','4','594','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "The Prophet ﷺ said: 'Whoever says after every prayer: None has the right to be worshipped except Allah, alone, without any partner...' (Muslim 594)",
  3,
  'None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
  'Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.')
link(3,13,3)

dhikr(14,'سُبْحَانَ اللَّهِ','Subhanallah',
  33,'hadith',None,None,'Muslim','4','597','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Abu Hurairah reported that the Messenger of Allah ﷺ said: 'Whoever glorifies Allah (says Subhanallah) after every prayer thirty-three times...' (Muslim 597)",
  4,'Glory be to Allah.','Maha Suci Allah.')
link(3,14,4)

dhikr(15,'الْحَمْدُ لِلَّهِ','Alhamdulillah',
  33,'hadith',None,None,'Muslim','4','597','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Abu Hurairah reported that the Messenger of Allah ﷺ said: '...and praises Allah (says Alhamdulillah) thirty-three times...' (Muslim 597)",
  5,'All praise is for Allah.','Segala puji bagi Allah.')
link(3,15,5)

dhikr(16,'اللَّهُ أَكْبَرُ','Allahu Akbar',
  33,'hadith',None,None,'Muslim','4','597','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Abu Hurairah reported that the Messenger of Allah ﷺ said: '...and magnifies Allah (says Allahu Akbar) thirty-three times...' (Muslim 597)",
  6,'Allah is the Greatest.','Allah Maha Besar.')
link(3,16,6)


# ---------------------------------------------------------------------------
# Category 4 — Before Sleep Adhkar
# ---------------------------------------------------------------------------
dhikr(17,'بِسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا','Bismika Allahumma amutu wa ahya',
  1,'hadith',None,None,'Al-Bukhari','80','6324','sahih',['Al-Bukhari'],
  'Reported in Sahih Al-Bukhari',
  "Hudhayfah reported: When the Prophet ﷺ went to bed at night, he would put his hand under his cheek and say: 'In Your name, O Allah, I die and I live.' (Al-Bukhari 6324)",
  1,'In Your name, O Allah, I die and I live.',
  'Dengan nama-Mu ya Allah, aku mati dan aku hidup.')
link(4,17,1)

dhikr(18,
  'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
  "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
  3,'hadith',None,None,'Abu Dawud','4','5045','sahih',['Al-Albani'],
  'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "Al-Bara ibn Azib reported that the Prophet ﷺ said to him: 'When you go to your bed, say: O Allah, protect me from Your punishment on the Day You resurrect Your servants.' (Abu Dawud 5045)",
  2,
  'O Allah, protect me from Your punishment on the Day You resurrect Your servants.',
  'Ya Allah, lindungilah aku dari azab-Mu pada hari Engkau membangkitkan hamba-hamba-Mu.')
link(4,18,2)

dhikr(19,
  'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
  "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa wajjahtu wajhi ilayk, wa alja'tu zahri ilayk, raghbatan wa rahbatan ilayk, la malja'a wa la manja minka illa ilayk, amantu bikitabikal-ladhi anzalt, wa binabiyyikal-ladhi arsalt",
  1,'hadith',None,None,'Al-Bukhari','80','6313','sahih',['Al-Bukhari','Muslim'],
  'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  "Al-Bara ibn Azib reported that the Prophet ﷺ said: 'When you go to your bed, perform ablution as for prayer, then lie on your right side and say: O Allah, I have submitted myself to You...' (Al-Bukhari 6313)",
  3,
  'O Allah, I have submitted myself to You, entrusted my affairs to You, turned my face to You, and laid myself down depending upon You, out of desire for You and fear of You. There is no refuge and no escape from You except to You. I believe in Your Book which You have revealed and in Your Prophet whom You have sent.',
  'Ya Allah, aku menyerahkan diriku kepada-Mu, mewakilkan urusanku kepada-Mu, menghadapkan wajahku kepada-Mu, dan menyandarkan punggungku kepada-Mu, karena mengharap dan takut kepada-Mu. Tidak ada tempat berlindung dan tidak ada tempat selamat dari-Mu kecuali kepada-Mu. Aku beriman kepada kitab-Mu yang Engkau turunkan dan kepada Nabi-Mu yang Engkau utus.')
link(4,19,3)

dhikr(20,
  'سُبْحَانَكَ اللَّهُمَّ رَبِّي بِكَ وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
  "Subhanakal-lahumma rabbi bika wada'tu janbi, wa bika arfa'uh, fa'in amsakta nafsi farhamha, wa in arsaltaha fahfazha bima tahfazu bihi 'ibadikas-salihin",
  1,'hadith',None,None,'Al-Bukhari','80','6320','sahih',['Al-Bukhari','Muslim'],
  'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  "Abu Hurairah reported that the Prophet ﷺ said: 'When any one of you goes to bed, let him say: Glory be to You, O Allah, my Lord, by You I lay down my side...' (Al-Bukhari 6320)",
  4,
  'Glory be to You, O Allah, my Lord. By You I lay down my side, and by You I raise it. If You take my soul, have mercy on it, and if You release it, protect it with that which You protect Your righteous servants.',
  'Maha Suci Engkau ya Allah, Rabbku. Dengan-Mu aku meletakkan lambungku dan dengan-Mu aku mengangkatnya. Jika Engkau menahan jiwaku maka rahmatilah ia, dan jika Engkau melepaskannya maka jagalah ia sebagaimana Engkau menjaga hamba-hamba-Mu yang shalih.')
link(4,20,4)

dhikr(21,
  'اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
  "Allahumma innaka khalaqta nafsi wa anta tawaffaha, laka mamatuha wa mahyaha, in ahyaytaha fahfazha, wa in amattaha faghfir laha, Allahumma inni as'alukal-'afiyah",
  1,'hadith',None,None,'Muslim','35','2712','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Ibn Umar reported that the Messenger of Allah ﷺ used to say when going to bed: 'O Allah, You created my soul and You take it back...' (Muslim 2712)",
  5,
  'O Allah, You created my soul and You take it back. Yours is its death and its life. If You give it life, protect it, and if You cause it to die, forgive it. O Allah, I ask You for well-being.',
  'Ya Allah, sesungguhnya Engkau menciptakan jiwaku dan Engkau yang mematikannya. Milik-Mu kematiannya dan kehidupannya. Jika Engkau menghidupkannya maka jagalah ia, dan jika Engkau mematikannya maka ampunilah ia. Ya Allah, sesungguhnya aku memohon kepada-Mu keselamatan.')
link(4,21,5)


# ---------------------------------------------------------------------------
# Category 5 — Waking Up Adhkar
# ---------------------------------------------------------------------------
dhikr(22,
  'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
  "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
  1,'hadith',None,None,'Al-Bukhari','80','6325','sahih',['Al-Bukhari'],
  'Reported in Sahih Al-Bukhari',
  "Hudhayfah reported: When the Prophet ﷺ woke up from sleep, he would say: 'All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.' (Al-Bukhari 6325)",
  1,
  'All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.',
  'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami dan kepada-Nya kebangkitan.')
link(5,22,1)

dhikr(23,
  'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
  "La ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu, wahuwa 'ala kulli shay'in qadir, subhanallah, walhamdu lillah, wa la ilaha illallah, wallahu akbar, wa la hawla wa la quwwata illa billahil-'aliyyil-'azim",
  1,'hadith',None,None,'Al-Bukhari','80','1154','sahih',['Al-Bukhari'],
  'Reported in Sahih Al-Bukhari',
  "Ubadah ibn As-Samit reported that the Prophet ﷺ said: 'Whoever wakes up at night and says: None has the right to be worshipped except Allah, alone, without any partner...' (Al-Bukhari 1154)",
  2,
  'None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent. Glory be to Allah, all praise is for Allah, none has the right to be worshipped except Allah, Allah is the Greatest, and there is no power and no might except with Allah, the Most High, the Most Great.',
  'Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu. Maha Suci Allah, segala puji bagi Allah, tidak ada ilah yang berhak disembah kecuali Allah, Allah Maha Besar, dan tidak ada daya dan kekuatan kecuali dengan Allah Yang Maha Tinggi lagi Maha Agung.')
link(5,23,2)

dhikr(24,
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ فَتْحَهُ وَنَصْرَهُ وَنُورَهُ وَبَرَكَتَهُ وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ',
  "Allahumma inni as'aluka khayra hadhal-yawmi fathahu wa nasrahu wa nurahu wa barakatahu wa hudah, wa a'udhu bika min sharri ma fihi wa sharri ma ba'dah",
  1,'hadith',None,None,'Abu Dawud','4','5084','hasan',['Al-Albani'],
  'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  "Abu Malik Al-Ashari reported that the Prophet ﷺ said: 'When you wake up in the morning, say: O Allah, I ask You for the good of this day...' (Abu Dawud 5084)",
  3,
  'O Allah, I ask You for the good of this day, its victory, its light, its blessings and its guidance. And I seek refuge in You from the evil of what is in it and the evil of what comes after it.',
  'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan hari ini, kemenangan, cahaya, keberkahan, dan petunjuknya. Dan aku berlindung kepada-Mu dari keburukan yang ada di dalamnya dan keburukan setelahnya.')
link(5,24,3)

dhikr(25,
  'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ',
  "Alhamdu lillahil-ladhi 'afani fi jasadi, wa radda 'alayya ruhi, wa adhina li bidhikrih",
  1,'hadith',None,None,'At-Tirmidhi','5','3401','hasan',['At-Tirmidhi','Al-Albani'],
  'Graded Hasan by At-Tirmidhi and Al-Albani',
  "Abu Hurairah reported that the Prophet ﷺ said: 'Whoever wakes up and says: All praise is for Allah who gave me health in my body and returned my soul to me...' (At-Tirmidhi 3401)",
  4,
  'All praise is for Allah who gave me health in my body, returned my soul to me, and permitted me to remember Him.',
  'Segala puji bagi Allah yang telah memberikan kesehatan pada tubuhku, mengembalikan ruhku kepadaku, dan mengizinkanku untuk berdzikir kepada-Nya.')
link(5,25,4)

dhikr(26,
  'أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
  "Asbahna 'ala fitratil-islam, wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina Muhammadin sallallahu 'alayhi wa sallam, wa 'ala millati abina Ibrahima hanifan musliman wa ma kana minal-mushrikin",
  1,'hadith',None,None,'Ahmad','4','23632','sahih',['Al-Albani','Ahmad'],
  'Graded Sahih by Al-Albani in Silsilah As-Sahihah',
  "The Prophet ﷺ said: 'Say in the morning: We have reached the morning upon the natural disposition of Islam...' (Ahmad 23632)",
  5,
  'We have reached the morning upon the natural disposition of Islam, upon the word of sincerity, upon the religion of our Prophet Muhammad ﷺ, and upon the way of our father Ibrahim, who was a monotheist and a Muslim, and was not of the polytheists.',
  'Kami telah memasuki waktu pagi di atas fitrah Islam, di atas kalimat ikhlas, di atas agama Nabi kami Muhammad ﷺ, dan di atas millah bapak kami Ibrahim yang hanif lagi muslim, dan dia bukan termasuk orang-orang musyrik.')
link(5,26,5)


# ---------------------------------------------------------------------------
# Category 6 — Entering Home
# ---------------------------------------------------------------------------
dhikr(27,
  'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
  "Bismillahi walajna, wa bismillahi kharajna, wa 'alallahi rabbina tawakkalna",
  1,'hadith',None,None,'Abu Dawud','4','5096','hasan',['Al-Albani'],
  'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  "The Prophet ﷺ said: 'When a man enters his house and mentions the name of Allah upon entering and upon eating, the devil says: You have no place to spend the night and no supper.' (Abu Dawud 5096)",
  1,
  'In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.',
  'Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Allah Rabb kami kami bertawakal.')
link(6,27,1)

dhikr(28,
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
  "Allahumma inni as'aluka khayral-mawliji wa khayral-makhraji, bismillahi walajna wa bismillahi kharajna wa 'alallahi rabbina tawakkalna",
  1,'hadith',None,None,'Abu Dawud','4','5096','hasan',['Al-Albani'],
  'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  "The Prophet ﷺ said: 'When one of you enters his house, let him say: O Allah, I ask You for the good of the entry and the good of the exit...' (Abu Dawud 5096)",
  2,
  'O Allah, I ask You for the good of the entry and the good of the exit. In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.',
  'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan masuk dan kebaikan keluar. Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Allah Rabb kami kami bertawakal.')
link(6,28,2)

dhikr(29,'السَّلَامُ عَلَيْكُمْ',"As-salamu 'alaykum",
  1,'quran','An-Nur',61,None,None,None,'sahih',
  ['Ibn Kathir','As-Sadi'],'Quranic verse — Surah An-Nur 24:61',
  "Allah says: '...then when you enter houses, greet one another with a greeting from Allah, blessed and good...' (Quran 24:61)",
  3,'Peace be upon you.','Semoga keselamatan atas kalian.')
link(6,29,3)

dhikr(30,'بِسْمِ اللَّهِ','Bismillah',
  1,'hadith',None,None,'Muslim','36','2018','sahih',['Muslim'],
  'Reported in Sahih Muslim',
  "Jabir reported that the Messenger of Allah ﷺ said: 'When a man enters his house and mentions the name of Allah upon entering and upon eating, the devil says: You have no place to spend the night and no supper.' (Muslim 2018)",
  4,'In the name of Allah.','Dengan nama Allah.')
link(6,30,4)

dhikr(31,
  'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
  "Allahumma barik lana fima razaqtana wa qina 'adhaban-nar",
  1,'hadith',None,None,'Ibn As-Sunni','1','462','hasan',['Al-Albani'],
  'Graded Hasan by Al-Albani',
  "The Prophet ﷺ taught his companions to say upon entering the home: 'O Allah, bless us in what You have provided for us and protect us from the punishment of the Fire.' (Ibn As-Sunni 462)",
  5,
  'O Allah, bless us in what You have provided for us and protect us from the punishment of the Fire.',
  'Ya Allah, berkahilah kami dalam apa yang Engkau rezekikan kepada kami dan lindungilah kami dari azab neraka.')
link(6,31,5)


# ---------------------------------------------------------------------------
# Category 7 — Leaving Home
# ---------------------------------------------------------------------------
dhikr(32,
  'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
  1,'hadith',None,None,'Abu Dawud','4','5095','sahih',['Al-Albani','At-Tirmidhi'],
  'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "Anas ibn Malik reported that the Prophet ﷺ said: 'When a man goes out of his house and says: In the name of Allah, I trust in Allah, there is no power and no strength except with Allah...' (Abu Dawud 5095)",
  1,
  'In the name of Allah, I place my trust in Allah, and there is no power and no strength except with Allah.',
  'Dengan nama Allah, aku bertawakal kepada Allah, dan tidak ada daya dan kekuatan kecuali dengan Allah.')
link(7,32,1)

dhikr(33,
  'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أَضِلَّ أَوْ أُضَلَّ، أَوْ أَزِلَّ أَوْ أُزَلَّ، أَوْ أَظْلِمَ أَوْ أُظْلَمَ، أَوْ أَجْهَلَ أَوْ يُجْهَلَ عَلَيَّ',
  "Allahumma inni a'udhu bika an adilla aw udall, aw azilla aw uzall, aw azlima aw uzlam, aw ajhala aw yujhala 'alayy",
  1,'hadith',None,None,'Abu Dawud','4','5094','sahih',['Al-Albani'],
  'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "Umm Salamah reported that the Prophet ﷺ never left her house without looking up to the sky and saying: 'O Allah, I seek refuge in You lest I stray or be led astray...' (Abu Dawud 5094)",
  2,
  'O Allah, I seek refuge in You lest I stray or be led astray, or slip or be caused to slip, or oppress or be oppressed, or behave foolishly or be treated foolishly.',
  'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari tersesat atau disesatkan, dari tergelincir atau digelincirkan, dari menzalimi atau dizalimi, dari berbuat bodoh atau diperlakukan dengan bodoh.')
link(7,33,2)

dhikr(34,
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ مَا خَرَجْتُ لَهُ',
  "Allahumma inni as'aluka khayra ma kharajtu lah",
  1,'hadith',None,None,'Ibn Majah','5','3887','hasan',['Al-Albani'],
  'Graded Hasan by Al-Albani in Sahih Ibn Majah',
  "The Prophet ﷺ said: 'When you leave your house, say: O Allah, I ask You for the good of what I have gone out for...' (Ibn Majah 3887)",
  3,
  'O Allah, I ask You for the good of what I have gone out for.',
  'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan dari apa yang aku keluar untuknya.')
link(7,34,3)

dhikr(35,
  'اللَّهُمَّ اكْلَأْنِي بِعَيْنِكَ الَّتِي لَا تَنَامُ، وَاكْنُفْنِي بِرُكْنِكَ الَّذِي لَا يُرَامُ',
  "Allahumma ikla'ni bi'aynikal-lati la tanam, wakknufni biruknikalladhi la yuram",
  1,'hadith',None,None,'Ibn As-Sunni','1','88','hasan',['Al-Albani'],
  'Graded Hasan by Al-Albani',
  "The Prophet ﷺ said: 'When you leave your house, say: O Allah, guard me with Your eye that never sleeps, and shelter me with Your side that cannot be assailed.' (Ibn As-Sunni 88)",
  4,
  'O Allah, guard me with Your eye that never sleeps, and shelter me with Your side that cannot be assailed.',
  'Ya Allah, jagalah aku dengan mata-Mu yang tidak pernah tidur, dan lindungilah aku dengan sisi-Mu yang tidak dapat diserang.')
link(7,35,4)

dhikr(36,
  'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
  "Allahumma inni a'udhu bika minal-hammi wal-hazan, wa a'udhu bika minal-'ajzi wal-kasal, wa a'udhu bika minal-jubni wal-bukhl, wa a'udhu bika min ghalabatid-dayni wa qahrir-rijal",
  1,'hadith',None,None,'Al-Bukhari','80','6369','sahih',['Al-Bukhari'],
  'Reported in Sahih Al-Bukhari',
  "Anas ibn Malik reported that the Prophet ﷺ used to say: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and from being overpowered by men.' (Al-Bukhari 6369)",
  5,
  'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and from being overpowered by men.',
  'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kesedihan dan kesusahan, dari kelemahan dan kemalasan, dari sifat pengecut dan kikir, dan dari lilitan hutang dan tekanan orang-orang.')
link(7,36,5)


# ---------------------------------------------------------------------------
# Category 8 — Eating Adhkar
# ---------------------------------------------------------------------------
dhikr(37,'بِسْمِ اللَّهِ','Bismillah',
  1,'hadith',None,None,'Abu Dawud','3','3767','sahih',['Al-Albani'],
  'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "The Prophet ﷺ said: 'When one of you eats, let him mention the name of Allah...' (Abu Dawud 3767)",
  1,'In the name of Allah.','Dengan nama Allah.')
link(8,37,1)

dhikr(38,'بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ','Bismillahi fi awwalihi wa akhirih',
  1,'hadith',None,None,'Abu Dawud','3','3767','sahih',['Al-Albani'],
  'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "The Prophet ﷺ said: 'If he forgets to mention the name of Allah at the beginning, let him say: In the name of Allah at its beginning and its end.' (Abu Dawud 3767)",
  2,'In the name of Allah at its beginning and its end.',
  'Dengan nama Allah pada awal dan akhirnya.')
link(8,38,2)

dhikr(39,
  'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
  "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
  1,'hadith',None,None,'Abu Dawud','3','4023','hasan',['Al-Albani','At-Tirmidhi'],
  'Graded Hasan by At-Tirmidhi and Al-Albani',
  "Muadh ibn Anas reported that the Prophet ﷺ said: 'Whoever eats food and then says: All praise is for Allah who fed me this and provided it for me without any power or strength from me — his past sins will be forgiven.' (Abu Dawud 4023)",
  3,
  'All praise is for Allah who fed me this and provided it for me without any power or strength from me.',
  'Segala puji bagi Allah yang telah memberiku makan ini dan merezekikannya kepadaku tanpa daya dan kekuatan dariku.')
link(8,39,3)

dhikr(40,
  'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ',
  "Allahumma barik lana fihi wa at'imna khayran minh",
  1,'hadith',None,None,'At-Tirmidhi','4','3455','hasan',['At-Tirmidhi','Al-Albani'],
  'Graded Hasan by At-Tirmidhi and Al-Albani',
  "The Prophet ﷺ said when drinking milk: 'O Allah, bless it for us and give us more of it.' (At-Tirmidhi 3455)",
  4,
  'O Allah, bless it for us and feed us with something better than it.',
  'Ya Allah, berkahilah kami di dalamnya dan berilah kami makan yang lebih baik darinya.')
link(8,40,4)

dhikr(41,
  'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ، غَيْرَ مَكْفِيٍّ وَلَا مُوَدَّعٍ وَلَا مُسْتَغْنًى عَنْهُ رَبَّنَا',
  "Alhamdu lillahi hamdan kathiran tayyiban mubarakan fih, ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu rabbana",
  1,'hadith',None,None,'Al-Bukhari','70','5458','sahih',['Al-Bukhari'],
  'Reported in Sahih Al-Bukhari',
  "Abu Umamah reported that when the Prophet ﷺ finished eating, he would say: 'All praise is for Allah, much praise, pure and blessed, not to be dispensed with, not to be abandoned, and not to be done without, O our Lord.' (Al-Bukhari 5458)",
  5,
  'All praise is for Allah, much praise, pure and blessed, not to be dispensed with, not to be abandoned, and not to be done without, O our Lord.',
  'Segala puji bagi Allah dengan pujian yang banyak, baik, dan penuh berkah, yang tidak dapat dicukupkan, tidak dapat ditinggalkan, dan tidak dapat diabaikan, wahai Rabb kami.')
link(8,41,5)


# ---------------------------------------------------------------------------
# Category 9 — General Remembrance
# ---------------------------------------------------------------------------
dhikr(42,'لَا إِلَهَ إِلَّا اللَّهُ','La ilaha illallah',
  None,'hadith',None,None,'At-Tirmidhi','5','3429','sahih',
  ['At-Tirmidhi','Al-Albani'],'Graded Sahih by Al-Albani in Sahih At-Tirmidhi',
  "The Prophet ﷺ said: 'The best dhikr is: La ilaha illallah (None has the right to be worshipped except Allah).' (At-Tirmidhi 3429)",
  1,'None has the right to be worshipped except Allah.',
  'Tidak ada ilah yang berhak disembah kecuali Allah.')
link(9,42,1)

dhikr(43,
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
  "Subhanallahi wa bihamdih, subhanallahil-'azim",
  None,'hadith',None,None,'Al-Bukhari','80','6682','sahih',
  ['Al-Bukhari','Muslim'],'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  "The Prophet ﷺ said: 'Two words are light on the tongue, heavy on the Scale, and beloved to the Most Merciful: Glory be to Allah and His is the praise, Glory be to Allah the Magnificent.' (Al-Bukhari 6682)",
  2,
  'Glory be to Allah and His is the praise. Glory be to Allah the Magnificent.',
  'Maha Suci Allah dan segala puji bagi-Nya. Maha Suci Allah Yang Maha Agung.')
link(9,43,2)

dhikr(44,'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ','La hawla wa la quwwata illa billah',
  None,'hadith',None,None,'Al-Bukhari','80','6384','sahih',
  ['Al-Bukhari','Muslim'],'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  "Abu Musa Al-Ashari reported that the Prophet ﷺ said: 'Shall I not tell you of a treasure from the treasures of Paradise? La hawla wa la quwwata illa billah.' (Al-Bukhari 6384)",
  3,'There is no power and no strength except with Allah.',
  'Tidak ada daya dan kekuatan kecuali dengan Allah.')
link(9,44,3)

dhikr(45,
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  "Allahumma salli wa sallim 'ala nabiyyina Muhammad",
  None,'quran','Al-Ahzab',56,None,None,None,'sahih',
  ['Ibn Kathir','As-Sadi'],'Quranic command — Surah Al-Ahzab 33:56',
  "Allah says: 'Indeed, Allah confers blessing upon the Prophet, and His angels [ask Him to do so]. O you who have believed, ask [Allah to confer] blessing upon him and ask [Allah to grant him] peace.' (Quran 33:56)",
  4,
  'O Allah, send prayers and peace upon our Prophet Muhammad.',
  'Ya Allah, limpahkanlah shalawat dan salam kepada Nabi kami Muhammad.')
link(9,45,4)

dhikr(46,
  'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
  "Rabbighfir li wa tub 'alayya innaka antat-tawwabur-rahim",
  100,'hadith',None,None,'Abu Dawud','2','1516','sahih',['Al-Albani'],
  'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  "Ibn Umar reported: We used to count that the Messenger of Allah ﷺ would say one hundred times in a single sitting: 'My Lord, forgive me and accept my repentance, for You are the Oft-Returning, the Most Merciful.' (Abu Dawud 1516)",
  5,
  'My Lord, forgive me and accept my repentance, for You are the Oft-Returning, the Most Merciful.',
  'Rabbku, ampunilah aku dan terimalah taubatku, sesungguhnya Engkau Maha Penerima Taubat lagi Maha Penyayang.')
link(9,46,5)

# ---------------------------------------------------------------------------
# Populate FTS5 virtual table
# ---------------------------------------------------------------------------
cur.execute("""
  INSERT INTO dhikr_fts (rowid, dhikr_id, arabic_text, transliteration)
  SELECT id, id, arabic_text, COALESCE(transliteration, '') FROM dhikr
""")

con.commit()
con.close()

print(f"adhkar.db created at: {OUTPUT}")
print("  Categories: 9")
print("  Dhikr entries: 46")
print("  Translation rows: 92 (en + id for each)")
