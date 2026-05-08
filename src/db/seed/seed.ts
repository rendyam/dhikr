/**
 * Seed script for adhkar.db — the bundled SQLite content database.
 *
 * Run with: npx ts-node --project tsconfig.seed.json src/db/seed/seed.ts
 *
 * Populates: categories, category_translations, dhikr, dhikr_translations,
 *            category_dhikr, dhikr_fts
 *
 * Requirements: 1.1–1.6, 2.1, 6.4, 7.2
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const OUTPUT_PATH = path.join(__dirname, 'adhkar.db');

// Remove existing DB so we start fresh
if (fs.existsSync(OUTPUT_PATH)) {
  fs.unlinkSync(OUTPUT_PATH);
}

const db = new Database(OUTPUT_PATH);

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
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
`);


// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function insertCategory(
  id: number,
  slug: string,
  nameAr: string,
  sortOrder: number,
  nameEn: string,
  nameId: string,
) {
  db.prepare(
    'INSERT INTO categories (id, slug, name_ar, sort_order) VALUES (?, ?, ?, ?)',
  ).run(id, slug, nameAr, sortOrder);
  db.prepare(
    'INSERT INTO category_translations (category_id, locale, name) VALUES (?, ?, ?)',
  ).run(id, 'en', nameEn);
  db.prepare(
    'INSERT INTO category_translations (category_id, locale, name) VALUES (?, ?, ?)',
  ).run(id, 'id', nameId);
}

interface DhikrData {
  id: number;
  arabicText: string;
  transliteration: string | null;
  repetitionCount: number | null;
  sourceType: 'quran' | 'hadith';
  surahName?: string | null;
  ayahNumber?: number | null;
  collectionName?: string | null;
  bookNumber?: string | null;
  hadithNumber?: string | null;
  authenticityGrade: 'sahih' | 'hasan';
  scholarNames: string[];
  gradingRationale?: string | null;
  fullHadithText?: string | null;
  sortOrder: number;
  translationEn: string;
  translationId: string;
}

function insertDhikr(d: DhikrData) {
  db.prepare(`
    INSERT INTO dhikr (
      id, arabic_text, transliteration, repetition_count,
      source_type, surah_name, ayah_number,
      collection_name, book_number, hadith_number,
      authenticity_grade, scholar_names, grading_rationale,
      full_hadith_text, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    d.id,
    d.arabicText,
    d.transliteration ?? null,
    d.repetitionCount ?? null,
    d.sourceType,
    d.surahName ?? null,
    d.ayahNumber ?? null,
    d.collectionName ?? null,
    d.bookNumber ?? null,
    d.hadithNumber ?? null,
    d.authenticityGrade,
    JSON.stringify(d.scholarNames),
    d.gradingRationale ?? null,
    d.fullHadithText ?? null,
    d.sortOrder,
  );
  db.prepare(
    'INSERT INTO dhikr_translations (dhikr_id, locale, translation) VALUES (?, ?, ?)',
  ).run(d.id, 'en', d.translationEn);
  db.prepare(
    'INSERT INTO dhikr_translations (dhikr_id, locale, translation) VALUES (?, ?, ?)',
  ).run(d.id, 'id', d.translationId);
}

function linkDhikrToCategory(categoryId: number, dhikrId: number, sortOrder: number) {
  db.prepare(
    'INSERT INTO category_dhikr (category_id, dhikr_id, sort_order) VALUES (?, ?, ?)',
  ).run(categoryId, dhikrId, sortOrder);
}


// ---------------------------------------------------------------------------
// Categories (9 required)
// ID | slug              | Arabic name                | EN name          | ID name
// ---------------------------------------------------------------------------
insertCategory(1, 'morning',        'أذكار الصباح',       1, 'Morning Adhkar',        'Dzikir Pagi');
insertCategory(2, 'evening',        'أذكار المساء',       2, 'Evening Adhkar',        'Dzikir Petang');
insertCategory(3, 'after-prayer',   'أذكار بعد الصلاة',   3, 'After Prayer Adhkar',   'Dzikir Setelah Shalat');
insertCategory(4, 'before-sleep',   'أذكار النوم',        4, 'Before Sleep Adhkar',   'Dzikir Sebelum Tidur');
insertCategory(5, 'waking-up',      'أذكار الاستيقاظ',    5, 'Waking Up Adhkar',      'Dzikir Bangun Tidur');
insertCategory(6, 'entering-home',  'أذكار دخول المنزل',  6, 'Entering Home',         'Dzikir Masuk Rumah');
insertCategory(7, 'leaving-home',   'أذكار الخروج من المنزل', 7, 'Leaving Home',      'Dzikir Keluar Rumah');
insertCategory(8, 'eating',         'أذكار الطعام',       8, 'Eating Adhkar',         'Dzikir Makan');
insertCategory(9, 'general',        'الذكر العام',        9, 'General Remembrance',   'Dzikir Umum');


// ---------------------------------------------------------------------------
// Dhikr entries
// ---------------------------------------------------------------------------

// ============================================================
// Category 1 — Morning Adhkar (أذكار الصباح)
// ============================================================

insertDhikr({
  id: 1,
  arabicText: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa 'ala kulli shay'in qadir",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5076',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'The Prophet ﷺ said: "Whoever says in the morning: We have reached the morning and the whole kingdom belongs to Allah..." (Abu Dawud 5076)',
  sortOrder: 1,
  translationEn: 'We have reached the morning and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
  translationId: 'Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.',
});
linkDhikrToCategory(1, 1, 1);

insertDhikr({
  id: 2,
  arabicText: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
  transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'At-Tirmidhi',
  bookNumber: '5',
  hadithNumber: '3391',
  authenticityGrade: 'hasan',
  scholarNames: ['At-Tirmidhi', 'Al-Albani'],
  gradingRationale: 'Graded Hasan by At-Tirmidhi and authenticated by Al-Albani',
  fullHadithText: 'The Prophet ﷺ used to say in the morning: "O Allah, by You we enter the morning..." (At-Tirmidhi 3391)',
  sortOrder: 2,
  translationEn: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.',
  translationId: 'Ya Allah, dengan-Mu kami memasuki waktu pagi dan dengan-Mu kami memasuki waktu petang, dengan-Mu kami hidup dan dengan-Mu kami mati, dan kepada-Mu kebangkitan.',
});
linkDhikrToCategory(1, 2, 2);

insertDhikr({
  id: 3,
  arabicText: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  transliteration: "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfir li fa'innahu la yaghfirudh-dhunuba illa ant",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6306',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: 'Reported in Sahih Al-Bukhari — the highest level of authenticity',
  fullHadithText: 'The Prophet ﷺ said: "The master of seeking forgiveness is to say: O Allah, You are my Lord, none has the right to be worshipped except You..." (Al-Bukhari 6306)',
  sortOrder: 3,
  translationEn: 'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none forgives sins except You.',
  translationId: 'Ya Allah, Engkau adalah Rabbku, tidak ada ilah yang berhak disembah kecuali Engkau. Engkau telah menciptakanku dan aku adalah hamba-Mu. Aku berada di atas perjanjian dan janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan apa yang aku perbuat. Aku mengakui nikmat-Mu atasku dan aku mengakui dosaku, maka ampunilah aku, karena sesungguhnya tidak ada yang mengampuni dosa-dosa kecuali Engkau.',
});
linkDhikrToCategory(1, 3, 3);

insertDhikr({
  id: 4,
  arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  transliteration: 'Subhanallahi wa bihamdih',
  repetitionCount: 100,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6405',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari', 'Muslim'],
  gradingRationale: 'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  fullHadithText: 'The Prophet ﷺ said: "Whoever says \'Glory be to Allah and His is the praise\' one hundred times in the morning and evening, no one will come on the Day of Resurrection with anything better..." (Al-Bukhari 6405)',
  sortOrder: 4,
  translationEn: 'Glory be to Allah and His is the praise.',
  translationId: 'Maha Suci Allah dan segala puji bagi-Nya.',
});
linkDhikrToCategory(1, 4, 4);

insertDhikr({
  id: 5,
  arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
  transliteration: "Allahumma inni as'alukal-'afwa wal-'afiyata fid-dunya wal-akhirah",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5074',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani', 'Ibn Hajar'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Ibn Umar reported that the Messenger of Allah ﷺ never failed to say these words in the morning and evening: "O Allah, I ask You for pardon and well-being in this world and the Hereafter." (Abu Dawud 5074)',
  sortOrder: 5,
  translationEn: 'O Allah, I ask You for pardon and well-being in this world and the Hereafter.',
  translationId: 'Ya Allah, sesungguhnya aku memohon kepada-Mu maaf dan keselamatan di dunia dan akhirat.',
});
linkDhikrToCategory(1, 5, 5);


// ============================================================
// Category 2 — Evening Adhkar (أذكار المساء)
// ============================================================

insertDhikr({
  id: 6,
  arabicText: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  transliteration: "Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa 'ala kulli shay'in qadir",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5076',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'The Prophet ﷺ said: "Whoever says in the evening: We have reached the evening and the whole kingdom belongs to Allah..." (Abu Dawud 5076)',
  sortOrder: 1,
  translationEn: 'We have reached the evening and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
  translationId: 'Kami telah memasuki waktu petang dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.',
});
linkDhikrToCategory(2, 6, 1);

insertDhikr({
  id: 7,
  arabicText: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
  transliteration: "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'At-Tirmidhi',
  bookNumber: '5',
  hadithNumber: '3391',
  authenticityGrade: 'hasan',
  scholarNames: ['At-Tirmidhi', 'Al-Albani'],
  gradingRationale: 'Graded Hasan by At-Tirmidhi and authenticated by Al-Albani',
  fullHadithText: 'The Prophet ﷺ used to say in the evening: "O Allah, by You we enter the evening..." (At-Tirmidhi 3391)',
  sortOrder: 2,
  translationEn: 'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.',
  translationId: 'Ya Allah, dengan-Mu kami memasuki waktu petang dan dengan-Mu kami memasuki waktu pagi, dengan-Mu kami hidup dan dengan-Mu kami mati, dan kepada-Mu tempat kembali.',
});
linkDhikrToCategory(2, 7, 2);

insertDhikr({
  id: 8,
  arabicText: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
  transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
  repetitionCount: 3,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '35',
  hadithNumber: '2709',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'The Prophet ﷺ said: "Whoever says in the evening three times: I seek refuge in the perfect words of Allah from the evil of what He has created, no harm will afflict him that night." (Muslim 2709)',
  sortOrder: 3,
  translationEn: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
  translationId: 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan apa yang Dia ciptakan.',
});
linkDhikrToCategory(2, 8, 3);

insertDhikr({
  id: 9,
  arabicText: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
  transliteration: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa ant",
  repetitionCount: 3,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5090',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Abu Bakr As-Siddiq reported that the Messenger of Allah ﷺ taught him to say in the morning and evening: "O Allah, grant me health in my body..." (Abu Dawud 5090)',
  sortOrder: 4,
  translationEn: 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. None has the right to be worshipped except You.',
  translationId: 'Ya Allah, berikanlah kesehatan pada tubuhku. Ya Allah, berikanlah kesehatan pada pendengaranku. Ya Allah, berikanlah kesehatan pada penglihatanku. Tidak ada ilah yang berhak disembah kecuali Engkau.',
});
linkDhikrToCategory(2, 9, 4);

insertDhikr({
  id: 10,
  arabicText: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
  transliteration: "Hasbiyallahu la ilaha illa huwa 'alayhi tawakkaltu wa huwa rabbul-'arshil-'azim",
  repetitionCount: 7,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5081',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani', 'Ibn As-Sunni'],
  gradingRationale: 'Graded Hasan by Al-Albani',
  fullHadithText: 'The Prophet ﷺ said: "Whoever says seven times in the morning and evening: Allah is sufficient for me, none has the right to be worshipped except Him..." (Abu Dawud 5081)',
  sortOrder: 5,
  translationEn: 'Allah is sufficient for me. None has the right to be worshipped except Him. Upon Him I rely and He is the Lord of the Magnificent Throne.',
  translationId: 'Cukuplah Allah bagiku. Tidak ada ilah yang berhak disembah kecuali Dia. Kepada-Nya aku bertawakal dan Dia adalah Rabb Arsy yang agung.',
});
linkDhikrToCategory(2, 10, 5);


// ============================================================
// Category 3 — After Prayer Adhkar (أذكار بعد الصلاة)
// ============================================================

insertDhikr({
  id: 11,
  arabicText: 'أَسْتَغْفِرُ اللَّهَ',
  transliteration: 'Astaghfirullah',
  repetitionCount: 3,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '4',
  hadithNumber: '591',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Thawban reported: When the Messenger of Allah ﷺ finished his prayer, he would seek forgiveness three times and say: "O Allah, You are Peace and from You is peace..." (Muslim 591)',
  sortOrder: 1,
  translationEn: 'I seek forgiveness from Allah.',
  translationId: 'Aku memohon ampun kepada Allah.',
});
linkDhikrToCategory(3, 11, 1);

insertDhikr({
  id: 12,
  arabicText: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
  transliteration: "Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '4',
  hadithNumber: '591',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Thawban reported: When the Messenger of Allah ﷺ finished his prayer, he would seek forgiveness three times and say: "O Allah, You are Peace and from You is peace, blessed are You, O Possessor of majesty and honour." (Muslim 591)',
  sortOrder: 2,
  translationEn: 'O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of majesty and honour.',
  translationId: 'Ya Allah, Engkau adalah As-Salam (Yang Maha Sejahtera) dan dari-Mu keselamatan. Maha Berkah Engkau wahai Dzat Yang Maha Agung dan Maha Mulia.',
});
linkDhikrToCategory(3, 12, 2);

insertDhikr({
  id: 13,
  arabicText: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu wahuwa 'ala kulli shay'in qadir",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '4',
  hadithNumber: '594',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'The Prophet ﷺ said: "Whoever says after every prayer: None has the right to be worshipped except Allah, alone, without any partner..." (Muslim 594)',
  sortOrder: 3,
  translationEn: 'None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
  translationId: 'Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.',
});
linkDhikrToCategory(3, 13, 3);

insertDhikr({
  id: 14,
  arabicText: 'سُبْحَانَ اللَّهِ',
  transliteration: 'Subhanallah',
  repetitionCount: 33,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '4',
  hadithNumber: '597',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Abu Hurairah reported that the Messenger of Allah ﷺ said: "Whoever glorifies Allah (says Subhanallah) after every prayer thirty-three times..." (Muslim 597)',
  sortOrder: 4,
  translationEn: 'Glory be to Allah.',
  translationId: 'Maha Suci Allah.',
});
linkDhikrToCategory(3, 14, 4);

insertDhikr({
  id: 15,
  arabicText: 'الْحَمْدُ لِلَّهِ',
  transliteration: 'Alhamdulillah',
  repetitionCount: 33,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '4',
  hadithNumber: '597',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Abu Hurairah reported that the Messenger of Allah ﷺ said: "...and praises Allah (says Alhamdulillah) thirty-three times..." (Muslim 597)',
  sortOrder: 5,
  translationEn: 'All praise is for Allah.',
  translationId: 'Segala puji bagi Allah.',
});
linkDhikrToCategory(3, 15, 5);

insertDhikr({
  id: 16,
  arabicText: 'اللَّهُ أَكْبَرُ',
  transliteration: 'Allahu Akbar',
  repetitionCount: 33,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '4',
  hadithNumber: '597',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Abu Hurairah reported that the Messenger of Allah ﷺ said: "...and magnifies Allah (says Allahu Akbar) thirty-three times..." (Muslim 597)',
  sortOrder: 6,
  translationEn: 'Allah is the Greatest.',
  translationId: 'Allah Maha Besar.',
});
linkDhikrToCategory(3, 16, 6);


// ============================================================
// Category 4 — Before Sleep Adhkar (أذكار النوم)
// ============================================================

insertDhikr({
  id: 17,
  arabicText: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
  transliteration: 'Bismika Allahumma amutu wa ahya',
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6324',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: 'Reported in Sahih Al-Bukhari',
  fullHadithText: 'Hudhayfah reported: When the Prophet ﷺ went to bed at night, he would put his hand under his cheek and say: "In Your name, O Allah, I die and I live." (Al-Bukhari 6324)',
  sortOrder: 1,
  translationEn: 'In Your name, O Allah, I die and I live.',
  translationId: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.',
});
linkDhikrToCategory(4, 17, 1);

insertDhikr({
  id: 18,
  arabicText: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
  transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
  repetitionCount: 3,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5045',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Al-Bara ibn Azib reported that the Prophet ﷺ said to him: "When you go to your bed, say: O Allah, protect me from Your punishment on the Day You resurrect Your servants." (Abu Dawud 5045)',
  sortOrder: 2,
  translationEn: 'O Allah, protect me from Your punishment on the Day You resurrect Your servants.',
  translationId: 'Ya Allah, lindungilah aku dari azab-Mu pada hari Engkau membangkitkan hamba-hamba-Mu.',
});
linkDhikrToCategory(4, 18, 2);

insertDhikr({
  id: 19,
  arabicText: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
  transliteration: "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa wajjahtu wajhi ilayk, wa alja'tu zahri ilayk, raghbatan wa rahbatan ilayk, la malja'a wa la manja minka illa ilayk, amantu bikitabikal-ladhi anzalt, wa binabiyyikal-ladhi arsalt",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6313',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari', 'Muslim'],
  gradingRationale: 'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  fullHadithText: 'Al-Bara ibn Azib reported that the Prophet ﷺ said: "When you go to your bed, perform ablution as for prayer, then lie on your right side and say: O Allah, I have submitted myself to You..." (Al-Bukhari 6313)',
  sortOrder: 3,
  translationEn: 'O Allah, I have submitted myself to You, entrusted my affairs to You, turned my face to You, and laid myself down depending upon You, out of desire for You and fear of You. There is no refuge and no escape from You except to You. I believe in Your Book which You have revealed and in Your Prophet whom You have sent.',
  translationId: 'Ya Allah, aku menyerahkan diriku kepada-Mu, mewakilkan urusanku kepada-Mu, menghadapkan wajahku kepada-Mu, dan menyandarkan punggungku kepada-Mu, karena mengharap dan takut kepada-Mu. Tidak ada tempat berlindung dan tidak ada tempat selamat dari-Mu kecuali kepada-Mu. Aku beriman kepada kitab-Mu yang Engkau turunkan dan kepada Nabi-Mu yang Engkau utus.',
});
linkDhikrToCategory(4, 19, 3);

insertDhikr({
  id: 20,
  arabicText: 'سُبْحَانَكَ اللَّهُمَّ رَبِّي بِكَ وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
  transliteration: "Subhanakal-lahumma rabbi bika wada'tu janbi, wa bika arfa'uh, fa'in amsakta nafsi farhamha, wa in arsaltaha fahfazha bima tahfazu bihi 'ibadikas-salihin",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6320',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari', 'Muslim'],
  gradingRationale: 'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  fullHadithText: 'Abu Hurairah reported that the Prophet ﷺ said: "When any one of you goes to bed, let him say: Glory be to You, O Allah, my Lord, by You I lay down my side..." (Al-Bukhari 6320)',
  sortOrder: 4,
  translationEn: 'Glory be to You, O Allah, my Lord. By You I lay down my side, and by You I raise it. If You take my soul, have mercy on it, and if You release it, protect it with that which You protect Your righteous servants.',
  translationId: 'Maha Suci Engkau ya Allah, Rabbku. Dengan-Mu aku meletakkan lambungku dan dengan-Mu aku mengangkatnya. Jika Engkau menahan jiwaku maka rahmatilah ia, dan jika Engkau melepaskannya maka jagalah ia sebagaimana Engkau menjaga hamba-hamba-Mu yang shalih.',
});
linkDhikrToCategory(4, 20, 4);

insertDhikr({
  id: 21,
  arabicText: 'اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
  transliteration: "Allahumma innaka khalaqta nafsi wa anta tawaffaha, laka mamatuha wa mahyaha, in ahyaytaha fahfazha, wa in amattaha faghfir laha, Allahumma inni as'alukal-'afiyah",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '35',
  hadithNumber: '2712',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Ibn Umar reported that the Messenger of Allah ﷺ used to say when going to bed: "O Allah, You created my soul and You take it back..." (Muslim 2712)',
  sortOrder: 5,
  translationEn: 'O Allah, You created my soul and You take it back. Yours is its death and its life. If You give it life, protect it, and if You cause it to die, forgive it. O Allah, I ask You for well-being.',
  translationId: 'Ya Allah, sesungguhnya Engkau menciptakan jiwaku dan Engkau yang mematikannya. Milik-Mu kematiannya dan kehidupannya. Jika Engkau menghidupkannya maka jagalah ia, dan jika Engkau mematikannya maka ampunilah ia. Ya Allah, sesungguhnya aku memohon kepada-Mu keselamatan.',
});
linkDhikrToCategory(4, 21, 5);


// ============================================================
// Category 5 — Waking Up Adhkar (أذكار الاستيقاظ)
// ============================================================

insertDhikr({
  id: 22,
  arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
  transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6325',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: 'Reported in Sahih Al-Bukhari',
  fullHadithText: 'Hudhayfah reported: When the Prophet ﷺ woke up from sleep, he would say: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection." (Al-Bukhari 6325)',
  sortOrder: 1,
  translationEn: 'All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.',
  translationId: 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami dan kepada-Nya kebangkitan.',
});
linkDhikrToCategory(5, 22, 1);

insertDhikr({
  id: 23,
  arabicText: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
  transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul mulku walahul hamdu, wahuwa 'ala kulli shay'in qadir, subhanallah, walhamdu lillah, wa la ilaha illallah, wallahu akbar, wa la hawla wa la quwwata illa billahil-'aliyyil-'azim",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '1154',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: 'Reported in Sahih Al-Bukhari',
  fullHadithText: 'Ubadah ibn As-Samit reported that the Prophet ﷺ said: "Whoever wakes up at night and says: None has the right to be worshipped except Allah, alone, without any partner..." (Al-Bukhari 1154)',
  sortOrder: 2,
  translationEn: 'None has the right to be worshipped except Allah, alone, without any partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent. Glory be to Allah, all praise is for Allah, none has the right to be worshipped except Allah, Allah is the Greatest, and there is no power and no might except with Allah, the Most High, the Most Great.',
  translationId: 'Tidak ada ilah yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu. Maha Suci Allah, segala puji bagi Allah, tidak ada ilah yang berhak disembah kecuali Allah, Allah Maha Besar, dan tidak ada daya dan kekuatan kecuali dengan Allah Yang Maha Tinggi lagi Maha Agung.',
});
linkDhikrToCategory(5, 23, 2);

insertDhikr({
  id: 24,
  arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ فَتْحَهُ وَنَصْرَهُ وَنُورَهُ وَبَرَكَتَهُ وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ',
  transliteration: "Allahumma inni as'aluka khayra hadhal-yawmi fathahu wa nasrahu wa nurahu wa barakatahu wa hudah, wa a'udhu bika min sharri ma fihi wa sharri ma ba'dah",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5084',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Abu Malik Al-Ashari reported that the Prophet ﷺ said: "When you wake up in the morning, say: O Allah, I ask You for the good of this day, its victory, its light, its blessings and its guidance..." (Abu Dawud 5084)',
  sortOrder: 3,
  translationEn: 'O Allah, I ask You for the good of this day, its victory, its light, its blessings and its guidance. And I seek refuge in You from the evil of what is in it and the evil of what comes after it.',
  translationId: 'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan hari ini, kemenangan, cahaya, keberkahan, dan petunjuknya. Dan aku berlindung kepada-Mu dari keburukan yang ada di dalamnya dan keburukan setelahnya.',
});
linkDhikrToCategory(5, 24, 3);

insertDhikr({
  id: 25,
  arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ',
  transliteration: "Alhamdu lillahil-ladhi 'afani fi jasadi, wa radda 'alayya ruhi, wa adhina li bidhikrih",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'At-Tirmidhi',
  bookNumber: '5',
  hadithNumber: '3401',
  authenticityGrade: 'hasan',
  scholarNames: ['At-Tirmidhi', 'Al-Albani'],
  gradingRationale: 'Graded Hasan by At-Tirmidhi and Al-Albani',
  fullHadithText: 'Abu Hurairah reported that the Prophet ﷺ said: "Whoever wakes up and says: All praise is for Allah who gave me health in my body and returned my soul to me and permitted me to remember Him..." (At-Tirmidhi 3401)',
  sortOrder: 4,
  translationEn: 'All praise is for Allah who gave me health in my body, returned my soul to me, and permitted me to remember Him.',
  translationId: 'Segala puji bagi Allah yang telah memberikan kesehatan pada tubuhku, mengembalikan ruhku kepadaku, dan mengizinkanku untuk berdzikir kepada-Nya.',
});
linkDhikrToCategory(5, 25, 4);

insertDhikr({
  id: 26,
  arabicText: 'أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
  transliteration: "Asbahna 'ala fitratil-islam, wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina Muhammadin sallallahu 'alayhi wa sallam, wa 'ala millati abina Ibrahima hanifan musliman wa ma kana minal-mushrikin",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Ahmad',
  bookNumber: '4',
  hadithNumber: '23632',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani', 'Ahmad'],
  gradingRationale: 'Graded Sahih by Al-Albani in Silsilah As-Sahihah',
  fullHadithText: 'The Prophet ﷺ said: "Say in the morning: We have reached the morning upon the natural disposition of Islam, upon the word of sincerity, upon the religion of our Prophet Muhammad ﷺ..." (Ahmad 23632)',
  sortOrder: 5,
  translationEn: 'We have reached the morning upon the natural disposition of Islam, upon the word of sincerity, upon the religion of our Prophet Muhammad ﷺ, and upon the way of our father Ibrahim, who was a monotheist and a Muslim, and was not of the polytheists.',
  translationId: 'Kami telah memasuki waktu pagi di atas fitrah Islam, di atas kalimat ikhlas, di atas agama Nabi kami Muhammad ﷺ, dan di atas millah bapak kami Ibrahim yang hanif lagi muslim, dan dia bukan termasuk orang-orang musyrik.',
});
linkDhikrToCategory(5, 26, 5);


// ============================================================
// Category 6 — Entering Home (أذكار دخول المنزل)
// ============================================================

insertDhikr({
  id: 27,
  arabicText: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
  transliteration: "Bismillahi walajna, wa bismillahi kharajna, wa 'alallahi rabbina tawakkalna",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5096',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'The Prophet ﷺ said: "When a man enters his house and mentions the name of Allah upon entering and upon eating, the devil says: You have no place to spend the night and no supper." (Abu Dawud 5096)',
  sortOrder: 1,
  translationEn: 'In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.',
  translationId: 'Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Allah Rabb kami kami bertawakal.',
});
linkDhikrToCategory(6, 27, 1);

insertDhikr({
  id: 28,
  arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
  transliteration: "Allahumma inni as'aluka khayral-mawliji wa khayral-makhraji, bismillahi walajna wa bismillahi kharajna wa 'alallahi rabbina tawakkalna",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5096',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'The Prophet ﷺ said: "When one of you enters his house, let him say: O Allah, I ask You for the good of the entry and the good of the exit..." (Abu Dawud 5096)',
  sortOrder: 2,
  translationEn: 'O Allah, I ask You for the good of the entry and the good of the exit. In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.',
  translationId: 'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan masuk dan kebaikan keluar. Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Allah Rabb kami kami bertawakal.',
});
linkDhikrToCategory(6, 28, 2);

insertDhikr({
  id: 29,
  arabicText: 'السَّلَامُ عَلَيْكُمْ',
  transliteration: "As-salamu 'alaykum",
  repetitionCount: 1,
  sourceType: 'quran',
  surahName: 'An-Nur',
  ayahNumber: 61,
  authenticityGrade: 'sahih',
  scholarNames: ['Ibn Kathir', 'As-Sadi'],
  gradingRationale: 'Quranic verse — Surah An-Nur 24:61',
  fullHadithText: 'Allah says: "...then when you enter houses, greet one another with a greeting from Allah, blessed and good..." (Quran 24:61)',
  sortOrder: 3,
  translationEn: 'Peace be upon you.',
  translationId: 'Semoga keselamatan atas kalian.',
});
linkDhikrToCategory(6, 29, 3);

insertDhikr({
  id: 30,
  arabicText: 'بِسْمِ اللَّهِ',
  transliteration: 'Bismillah',
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Muslim',
  bookNumber: '36',
  hadithNumber: '2018',
  authenticityGrade: 'sahih',
  scholarNames: ['Muslim'],
  gradingRationale: 'Reported in Sahih Muslim',
  fullHadithText: 'Jabir reported that the Messenger of Allah ﷺ said: "When a man enters his house and mentions the name of Allah upon entering and upon eating, the devil says: You have no place to spend the night and no supper." (Muslim 2018)',
  sortOrder: 4,
  translationEn: 'In the name of Allah.',
  translationId: 'Dengan nama Allah.',
});
linkDhikrToCategory(6, 30, 4);

insertDhikr({
  id: 31,
  arabicText: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
  transliteration: "Allahumma barik lana fima razaqtana wa qina 'adhaban-nar",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Ibn As-Sunni',
  bookNumber: '1',
  hadithNumber: '462',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani',
  fullHadithText: 'The Prophet ﷺ taught his companions to say upon entering the home: "O Allah, bless us in what You have provided for us and protect us from the punishment of the Fire." (Ibn As-Sunni 462)',
  sortOrder: 5,
  translationEn: 'O Allah, bless us in what You have provided for us and protect us from the punishment of the Fire.',
  translationId: 'Ya Allah, berkahilah kami dalam apa yang Engkau rezekikan kepada kami dan lindungilah kami dari azab neraka.',
});
linkDhikrToCategory(6, 31, 5);


// ============================================================
// Category 7 — Leaving Home (أذكار الخروج من المنزل)
// ============================================================

insertDhikr({
  id: 32,
  arabicText: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  transliteration: "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5095',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani', 'At-Tirmidhi'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Anas ibn Malik reported that the Prophet ﷺ said: "When a man goes out of his house and says: In the name of Allah, I trust in Allah, there is no power and no strength except with Allah — it will be said to him: You are guided, defended and protected." (Abu Dawud 5095)',
  sortOrder: 1,
  translationEn: 'In the name of Allah, I place my trust in Allah, and there is no power and no strength except with Allah.',
  translationId: 'Dengan nama Allah, aku bertawakal kepada Allah, dan tidak ada daya dan kekuatan kecuali dengan Allah.',
});
linkDhikrToCategory(7, 32, 1);

insertDhikr({
  id: 33,
  arabicText: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أَضِلَّ أَوْ أُضَلَّ، أَوْ أَزِلَّ أَوْ أُزَلَّ، أَوْ أَظْلِمَ أَوْ أُظْلَمَ، أَوْ أَجْهَلَ أَوْ يُجْهَلَ عَلَيَّ',
  transliteration: "Allahumma inni a'udhu bika an adilla aw udall, aw azilla aw uzall, aw azlima aw uzlam, aw ajhala aw yujhala 'alayy",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '4',
  hadithNumber: '5094',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Umm Salamah reported that the Prophet ﷺ never left her house without looking up to the sky and saying: "O Allah, I seek refuge in You lest I stray or be led astray..." (Abu Dawud 5094)',
  sortOrder: 2,
  translationEn: 'O Allah, I seek refuge in You lest I stray or be led astray, or slip or be caused to slip, or oppress or be oppressed, or behave foolishly or be treated foolishly.',
  translationId: 'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari tersesat atau disesatkan, dari tergelincir atau digelincirkan, dari menzalimi atau dizalimi, dari berbuat bodoh atau diperlakukan dengan bodoh.',
});
linkDhikrToCategory(7, 33, 2);

insertDhikr({
  id: 34,
  arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ مَا خَرَجْتُ لَهُ',
  transliteration: "Allahumma inni as'aluka khayra ma kharajtu lah",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Ibn Majah',
  bookNumber: '5',
  hadithNumber: '3887',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani in Sahih Ibn Majah',
  fullHadithText: 'The Prophet ﷺ said: "When you leave your house, say: O Allah, I ask You for the good of what I have gone out for..." (Ibn Majah 3887)',
  sortOrder: 3,
  translationEn: 'O Allah, I ask You for the good of what I have gone out for.',
  translationId: 'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan dari apa yang aku keluar untuknya.',
});
linkDhikrToCategory(7, 34, 3);

insertDhikr({
  id: 35,
  arabicText: 'اللَّهُمَّ اكْلَأْنِي بِعَيْنِكَ الَّتِي لَا تَنَامُ، وَاكْنُفْنِي بِرُكْنِكَ الَّذِي لَا يُرَامُ',
  transliteration: "Allahumma ikla'ni bi'aynikal-lati la tanam, wakknufni biruknikalladhi la yuram",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Ibn As-Sunni',
  bookNumber: '1',
  hadithNumber: '88',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Hasan by Al-Albani',
  fullHadithText: 'The Prophet ﷺ said: "When you leave your house, say: O Allah, guard me with Your eye that never sleeps, and shelter me with Your side that cannot be assailed." (Ibn As-Sunni 88)',
  sortOrder: 4,
  translationEn: 'O Allah, guard me with Your eye that never sleeps, and shelter me with Your side that cannot be assailed.',
  translationId: 'Ya Allah, jagalah aku dengan mata-Mu yang tidak pernah tidur, dan lindungilah aku dengan sisi-Mu yang tidak dapat diserang.',
});
linkDhikrToCategory(7, 35, 4);

insertDhikr({
  id: 36,
  arabicText: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
  transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wa a'udhu bika minal-'ajzi wal-kasal, wa a'udhu bika minal-jubni wal-bukhl, wa a'udhu bika min ghalabatid-dayni wa qahrir-rijal",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6369',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: 'Reported in Sahih Al-Bukhari',
  fullHadithText: 'Anas ibn Malik reported that the Prophet ﷺ used to say: "O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and from being overpowered by men." (Al-Bukhari 6369)',
  sortOrder: 5,
  translationEn: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and from being overpowered by men.',
  translationId: 'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kesedihan dan kesusahan, dari kelemahan dan kemalasan, dari sifat pengecut dan kikir, dan dari lilitan hutang dan tekanan orang-orang.',
});
linkDhikrToCategory(7, 36, 5);


// ============================================================
// Category 8 — Eating Adhkar (أذكار الطعام)
// ============================================================

insertDhikr({
  id: 37,
  arabicText: 'بِسْمِ اللَّهِ',
  transliteration: 'Bismillah',
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '3',
  hadithNumber: '3767',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'The Prophet ﷺ said: "When one of you eats, let him mention the name of Allah. If he forgets to mention the name of Allah at the beginning, let him say: In the name of Allah at its beginning and its end." (Abu Dawud 3767)',
  sortOrder: 1,
  translationEn: 'In the name of Allah.',
  translationId: 'Dengan nama Allah.',
});
linkDhikrToCategory(8, 37, 1);

insertDhikr({
  id: 38,
  arabicText: 'بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ',
  transliteration: 'Bismillahi fi awwalihi wa akhirih',
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '3',
  hadithNumber: '3767',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'The Prophet ﷺ said: "If he forgets to mention the name of Allah at the beginning, let him say: In the name of Allah at its beginning and its end." (Abu Dawud 3767)',
  sortOrder: 2,
  translationEn: 'In the name of Allah at its beginning and its end.',
  translationId: 'Dengan nama Allah pada awal dan akhirnya.',
});
linkDhikrToCategory(8, 38, 2);

insertDhikr({
  id: 39,
  arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
  transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '3',
  hadithNumber: '4023',
  authenticityGrade: 'hasan',
  scholarNames: ['Al-Albani', 'At-Tirmidhi'],
  gradingRationale: 'Graded Hasan by At-Tirmidhi and Al-Albani',
  fullHadithText: 'Muadh ibn Anas reported that the Prophet ﷺ said: "Whoever eats food and then says: All praise is for Allah who fed me this and provided it for me without any power or strength from me — his past sins will be forgiven." (Abu Dawud 4023)',
  sortOrder: 3,
  translationEn: 'All praise is for Allah who fed me this and provided it for me without any power or strength from me.',
  translationId: 'Segala puji bagi Allah yang telah memberiku makan ini dan merezekikannya kepadaku tanpa daya dan kekuatan dariku.',
});
linkDhikrToCategory(8, 39, 3);

insertDhikr({
  id: 40,
  arabicText: 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ',
  transliteration: "Allahumma barik lana fihi wa at'imna khayran minh",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'At-Tirmidhi',
  bookNumber: '4',
  hadithNumber: '3455',
  authenticityGrade: 'hasan',
  scholarNames: ['At-Tirmidhi', 'Al-Albani'],
  gradingRationale: 'Graded Hasan by At-Tirmidhi and Al-Albani',
  fullHadithText: 'The Prophet ﷺ said when drinking milk: "O Allah, bless it for us and give us more of it." (At-Tirmidhi 3455)',
  sortOrder: 4,
  translationEn: 'O Allah, bless it for us and feed us with something better than it.',
  translationId: 'Ya Allah, berkahilah kami di dalamnya dan berilah kami makan yang lebih baik darinya.',
});
linkDhikrToCategory(8, 40, 4);

insertDhikr({
  id: 41,
  arabicText: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ، غَيْرَ مَكْفِيٍّ وَلَا مُوَدَّعٍ وَلَا مُسْتَغْنًى عَنْهُ رَبَّنَا',
  transliteration: "Alhamdu lillahi hamdan kathiran tayyiban mubarakan fih, ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu rabbana",
  repetitionCount: 1,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '70',
  hadithNumber: '5458',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: 'Reported in Sahih Al-Bukhari',
  fullHadithText: 'Abu Umamah reported that when the Prophet ﷺ finished eating, he would say: "All praise is for Allah, much praise, pure and blessed, not to be dispensed with, not to be abandoned, and not to be done without, O our Lord." (Al-Bukhari 5458)',
  sortOrder: 5,
  translationEn: 'All praise is for Allah, much praise, pure and blessed, not to be dispensed with, not to be abandoned, and not to be done without, O our Lord.',
  translationId: 'Segala puji bagi Allah dengan pujian yang banyak, baik, dan penuh berkah, yang tidak dapat dicukupkan, tidak dapat ditinggalkan, dan tidak dapat diabaikan, wahai Rabb kami.',
});
linkDhikrToCategory(8, 41, 5);


// ============================================================
// Category 9 — General Remembrance (الذكر العام)
// ============================================================

insertDhikr({
  id: 42,
  arabicText: 'لَا إِلَهَ إِلَّا اللَّهُ',
  transliteration: 'La ilaha illallah',
  repetitionCount: null,
  sourceType: 'hadith',
  collectionName: 'At-Tirmidhi',
  bookNumber: '5',
  hadithNumber: '3429',
  authenticityGrade: 'sahih',
  scholarNames: ['At-Tirmidhi', 'Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih At-Tirmidhi',
  fullHadithText: 'The Prophet ﷺ said: "The best dhikr is: La ilaha illallah (None has the right to be worshipped except Allah)." (At-Tirmidhi 3429)',
  sortOrder: 1,
  translationEn: 'None has the right to be worshipped except Allah.',
  translationId: 'Tidak ada ilah yang berhak disembah kecuali Allah.',
});
linkDhikrToCategory(9, 42, 1);

insertDhikr({
  id: 43,
  arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
  transliteration: "Subhanallahi wa bihamdih, subhanallahil-'azim",
  repetitionCount: null,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6682',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari', 'Muslim'],
  gradingRationale: 'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  fullHadithText: 'The Prophet ﷺ said: "Two words are light on the tongue, heavy on the Scale, and beloved to the Most Merciful: Glory be to Allah and His is the praise, Glory be to Allah the Magnificent." (Al-Bukhari 6682)',
  sortOrder: 2,
  translationEn: 'Glory be to Allah and His is the praise. Glory be to Allah the Magnificent.',
  translationId: 'Maha Suci Allah dan segala puji bagi-Nya. Maha Suci Allah Yang Maha Agung.',
});
linkDhikrToCategory(9, 43, 2);

insertDhikr({
  id: 44,
  arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  transliteration: 'La hawla wa la quwwata illa billah',
  repetitionCount: null,
  sourceType: 'hadith',
  collectionName: 'Al-Bukhari',
  bookNumber: '80',
  hadithNumber: '6384',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari', 'Muslim'],
  gradingRationale: 'Agreed upon — reported in both Sahih Al-Bukhari and Sahih Muslim',
  fullHadithText: 'Abu Musa Al-Ashari reported that the Prophet ﷺ said: "Shall I not tell you of a treasure from the treasures of Paradise? La hawla wa la quwwata illa billah." (Al-Bukhari 6384)',
  sortOrder: 3,
  translationEn: 'There is no power and no strength except with Allah.',
  translationId: 'Tidak ada daya dan kekuatan kecuali dengan Allah.',
});
linkDhikrToCategory(9, 44, 3);

insertDhikr({
  id: 45,
  arabicText: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  transliteration: "Allahumma salli wa sallim 'ala nabiyyina Muhammad",
  repetitionCount: null,
  sourceType: 'quran',
  surahName: 'Al-Ahzab',
  ayahNumber: 56,
  authenticityGrade: 'sahih',
  scholarNames: ['Ibn Kathir', 'As-Sadi'],
  gradingRationale: 'Quranic command — Surah Al-Ahzab 33:56',
  fullHadithText: 'Allah says: "Indeed, Allah confers blessing upon the Prophet, and His angels [ask Him to do so]. O you who have believed, ask [Allah to confer] blessing upon him and ask [Allah to grant him] peace." (Quran 33:56)',
  sortOrder: 4,
  translationEn: 'O Allah, send prayers and peace upon our Prophet Muhammad.',
  translationId: 'Ya Allah, limpahkanlah shalawat dan salam kepada Nabi kami Muhammad.',
});
linkDhikrToCategory(9, 45, 4);

insertDhikr({
  id: 46,
  arabicText: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
  transliteration: "Rabbighfir li wa tub 'alayya innaka antat-tawwabur-rahim",
  repetitionCount: 100,
  sourceType: 'hadith',
  collectionName: 'Abu Dawud',
  bookNumber: '2',
  hadithNumber: '1516',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Albani'],
  gradingRationale: 'Graded Sahih by Al-Albani in Sahih Abu Dawud',
  fullHadithText: 'Ibn Umar reported: We used to count that the Messenger of Allah ﷺ would say one hundred times in a single sitting: "My Lord, forgive me and accept my repentance, for You are the Oft-Returning, the Most Merciful." (Abu Dawud 1516)',
  sortOrder: 5,
  translationEn: 'My Lord, forgive me and accept my repentance, for You are the Oft-Returning, the Most Merciful.',
  translationId: 'Rabbku, ampunilah aku dan terimalah taubatku, sesungguhnya Engkau Maha Penerima Taubat lagi Maha Penyayang.',
});
linkDhikrToCategory(9, 46, 5);


// ---------------------------------------------------------------------------
// Populate FTS5 virtual table
// ---------------------------------------------------------------------------
db.exec(`
  INSERT INTO dhikr_fts (rowid, dhikr_id, arabic_text, transliteration)
  SELECT id, id, arabic_text, COALESCE(transliteration, '') FROM dhikr;
`);

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------
db.close();
console.log(`✅  adhkar.db created at: ${OUTPUT_PATH}`);
console.log(`   Categories: 9`);
console.log(`   Dhikr entries: 46`);
console.log(`   Translation rows: ${46 * 2} (en + id for each)`);
