// Seed data for the mock API, generated the same way on every load (no randomness),
// so tests and screenshots are stable. 1 class, 24 students, plans for Nov + Dec 2026,
// and daily logs for the past days of November 2026.
import { datesOfMonth, isWeekend, dayOfWeek } from '../../lib/date.js';

export const CLASSES = [{ id: 1, name: 'Himawari ひまわり組' }];

// [name_en, name_ja, name_kana, parent_name, notes]
const PEOPLE = [
  ['Haruto Sato', '佐藤 陽翔', 'さとう はると', '佐藤 美咲', 'Egg allergy 卵アレルギー'],
  ['Yui Suzuki', '鈴木 結衣', 'すずき ゆい', '鈴木 健太', ''],
  ['Sota Takahashi', '高橋 蒼汰', 'たかはし そうた', '高橋 由美', 'Asthma — inhaler in bag. ぜんそく(吸入器はかばんの中)'],
  ['Mei Tanaka', '田中 芽依', 'たなか めい', '田中 翔', 'Grandmother picks up on Fridays. 金曜日は祖母がお迎え'],
  ['Riku Ito', '伊藤 陸', 'いとう りく', '伊藤 愛', ''],
  ['Hina Watanabe', '渡辺 陽菜', 'わたなべ ひな', '渡辺 大輔', 'Milk allergy 乳アレルギー'],
  ['Minato Yamamoto', '山本 湊', 'やまもと みなと', '山本 彩', ''],
  ['Sakura Nakamura', '中村 さくら', 'なかむら さくら', '中村 拓也', 'Naps with own blanket. お昼寝は自分の毛布で'],
  ['Yuto Kobayashi', '小林 悠斗', 'こばやし ゆうと', '小林 真由美', ''],
  ['Aoi Kato', '加藤 葵', 'かとう あおい', '加藤 直樹', 'Wheat allergy 小麦アレルギー'],
  ['Ren Yoshida', '吉田 蓮', 'よしだ れん', '吉田 香織', ''],
  ['Rin Yamada', '山田 凛', 'やまだ りん', '山田 誠', 'Father picks up. お迎えは父'],
  ['Itsuki Sasaki', '佐々木 樹', 'ささき いつき', '佐々木 恵', ''],
  ['Tsumugi Yamaguchi', '山口 紬', 'やまぐち つむぎ', '山口 亮', ''],
  ['Asahi Matsumoto', '松本 朝陽', 'まつもと あさひ', '松本 優子', 'Peanut allergy ピーナッツアレルギー'],
  ['Mio Inoue', '井上 澪', 'いのうえ みお', '井上 和也', ''],
  ['Kaito Kimura', '木村 海斗', 'きむら かいと', '木村 由香', ''],
  ['Himari Hayashi', '林 陽葵', 'はやし ひまり', '林 浩二', 'Shy in the morning, needs time to settle. 朝は少し時間が必要'],
  ['Haruki Shimizu', '清水 春樹', 'しみず はるき', '清水 舞', ''],
  ['Akari Yamazaki', '山崎 朱莉', 'やまざき あかり', '山崎 健一', ''],
  ['Yamato Mori', '森 大和', 'もり やまと', '森 千春', 'Eczema cream after lunch. 昼食後に保湿クリーム'],
  ['Koharu Abe', '阿部 心春', 'あべ こはる', '阿部 雄太', ''],
  ['Daiki Ikeda', '池田 大輝', 'いけだ だいき', '池田 裕子', ''],
  ['Ema Hashimoto', '橋本 恵麻', 'はしもと えま', '橋本 剛', ''],
];

// Japanese public holidays in the seeded months.
const HOLIDAYS = new Set(['2026-11-03', '2026-11-23']);

/** Small deterministic hash -> non-negative int. */
export function hash(a, b) {
  let x = (Math.imul(a, 2654435761) + Math.imul(b, 40503)) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0x5bd1e995) >>> 0;
  x ^= x >>> 15;
  return x;
}

function dayNum(iso) {
  return Number(iso.replace(/-/g, ''));
}

function buildStudents() {
  return PEOPLE.map(([name_en, name_ja, name_kana, parent_name, notes], i) => {
    const id = i + 1;
    const year = id % 3 === 0 ? 2021 : 2022;
    const month = String(((id * 5) % 12) + 1).padStart(2, '0');
    const day = String(((id * 7) % 27) + 1).padStart(2, '0');
    return {
      id,
      class_id: 1,
      name_en,
      name_ja,
      name_kana,
      birthday: `${year}-${month}-${day}`,
      parent_name,
      parent_phone: `090-0000-${String(1000 + id * 37).slice(-4)}`,
      notes,
      is_active: true,
      created_at: '2026-04-01T09:00:00+09:00',
    };
  });
}

function schoolDays(ym) {
  return datesOfMonth(ym).filter((d) => !isWeekend(d) && !HOLIDAYS.has(d));
}

/** Pattern of planned days per student, so the Today screen has variety. */
function plannedDaysFor(id, ym) {
  return schoolDays(ym).filter((d) => {
    const dow = dayOfWeek(d);
    if (id % 5 === 1 && dow === 3) return false; // no Wednesdays
    if (id % 7 === 3 && dow === 5) return false; // no Fridays
    if (id % 4 === 2 && dow === 1 && d.endsWith('16')) return false; // one Monday off
    return true;
  });
}

// Students without a November plan show as "Day off" on the Today screen.
const NO_NOV_PLAN = new Set([6, 22]);

function buildPlans() {
  const plans = [];
  let planId = 1;
  for (let id = 1; id <= PEOPLE.length; id++) {
    if (!NO_NOV_PLAN.has(id)) {
      plans.push({
        id: planId++,
        student_id: id,
        month: '2026-11-01',
        snack_deposit: 500,
        bento_deposit: 450,
        money_received: id % 9 !== 0,
        report_received_on: `2026-10-${String(20 + (id % 8)).padStart(2, '0')}`,
        parent_notes: id === 4 ? 'Dentist on the 20th, may arrive late. 20日は歯医者のため遅れるかもしれません' : '',
        days: plannedDaysFor(id, '2026-11'),
      });
    }
    if (id % 2 === 1) {
      const trip = id === 3;
      plans.push({
        id: planId++,
        student_id: id,
        month: '2026-12-01',
        snack_deposit: 500,
        bento_deposit: 450,
        money_received: id % 3 === 0,
        report_received_on: `2026-11-${String(9 + (id % 5)).padStart(2, '0')}`,
        parent_notes: trip ? 'Family trip on 24–25 Dec. 12月24〜25日は家族旅行' : '',
        days: plannedDaysFor(id, '2026-12').filter((d) => d <= '2026-12-25' && !(trip && d >= '2026-12-24')),
      });
    }
  }
  return plans;
}

const BENTO = [
  'Rice, tamagoyaki, broccoli, karaage',
  'Onigiri, sausage, cherry tomatoes',
  'Sandwich, apple slices, cheese',
  'Fried rice, edamame, mandarin',
  'Udon, boiled egg, carrots',
  'Rice, salmon, spinach, potato salad',
];
const AM = [
  'Outdoor play in the park, sang autumn songs. 公園で外遊び、秋の歌',
  'Drawing with crayons. クレヨンでお絵かき',
  'Walk to collect leaves. 落ち葉拾いの散歩',
  'Building blocks and puzzles. 積み木とパズル',
  'Rhythm and dance. リトミック',
];
const PM = [
  'Nap, then leaf collage craft. お昼寝のあと落ち葉の工作',
  'Nap, then picture books. お昼寝のあと絵本',
  'Nap, then playing house. お昼寝のあとままごと',
  'Nap, then clay play. お昼寝のあと粘土遊び',
];
const EATEN = ['all', 'all', 'most', 'half', 'little'];
const BM_COND = ['normal', 'normal', 'normal', 'soft', 'hard'];

// Hand-picked days to show warnings in the UI.
const FEVER_DAYS = new Set(['3|2026-11-13', '11|2026-11-12', '17|2026-11-10', '9|2026-11-06']);
const BIG_SPENDERS = new Set([3, 11]); // these go below a ¥0 snack balance

function hm(minutesAfterMidnight) {
  const h = Math.floor(minutesAfterMidnight / 60);
  const m = minutesAfterMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildLog(id, date, logId) {
  const h = hash(id, dayNum(date));
  const base = { id: logId, student_id: id, date, created_by: 1, created_at: `${date}T09:00:00+09:00`, updated_at: `${date}T17:00:00+09:00` };
  if (h % 17 === 0) {
    return {
      ...base, status: 'absent', arrival_time: null, temperature: null, temp_measured_at: null,
      lunch_contents: '', lunch_eaten: null, medicine_taken: false, medicine_name: '', medicine_time: null,
      activities_am: '', activities_pm: '', teacher_notes: 'Absent — parent called in the morning. 朝、保護者から欠席連絡',
      bm_count: 0, bm_condition: null, snack_spent: 0, bento_spent: 0,
    };
  }
  const fever = FEVER_DAYS.has(`${id}|${date}`);
  const arrival = 8 * 60 + 20 + (h % 50);
  const temp = fever ? 37.5 + ((h % 4) / 10) : 36.3 + ((h >>> 3) % 9) / 10;
  const medicine = fever || h % 11 === 0;
  const bmCount = (h >>> 5) % 3;
  return {
    ...base,
    status: 'present',
    arrival_time: hm(arrival),
    temperature: Math.round(temp * 10) / 10,
    temp_measured_at: hm(arrival + 5),
    lunch_contents: BENTO[h % BENTO.length],
    lunch_eaten: fever ? 'half' : EATEN[(h >>> 4) % EATEN.length],
    medicine_taken: medicine,
    medicine_name: medicine ? 'Cough syrup 咳止めシロップ' : '',
    medicine_time: medicine ? '12:30' : null,
    activities_am: AM[dayNum(date) % AM.length],
    activities_pm: PM[dayNum(date) % PM.length],
    teacher_notes: fever ? 'Slight fever, rested quietly before nap. 微熱あり、お昼寝前に静かに休みました' : '',
    bm_count: bmCount,
    bm_condition: bmCount > 0 ? BM_COND[(h >>> 7) % BM_COND.length] : null,
    snack_spent: BIG_SPENDERS.has(id) ? 90 : [20, 30, 40][(h >>> 2) % 3],
    bento_spent: h % 5 === 0 ? 150 : 0,
  };
}

const LOGS_UNTIL = '2026-11-13'; // last school day before "today" (Sun 15 Nov 2026)

function buildLogs(plans) {
  const logs = [];
  for (const plan of plans) {
    if (plan.month !== '2026-11-01') continue;
    for (const date of plan.days) {
      if (date > LOGS_UNTIL) continue;
      logs.push(buildLog(plan.student_id, date, logs.length + 1));
    }
  }
  return logs;
}

export function buildSeed() {
  const students = buildStudents();
  const plans = buildPlans();
  const logs = buildLogs(plans);
  return { classes: structuredClone(CLASSES), students, plans, logs };
}
