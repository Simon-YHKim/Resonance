/* 캐릭터 템플릿 — 기획서 v2.4 §27.3 변환표 + v1.0 §1-4 사전 생성 콘텐츠 패턴
 *
 * 카테고리별 풀에서 닉네임 해시 시드로 결정적 1개 선택.
 * 같은 닉네임은 항상 같은 템플릿 → 어뷰저 도배 차단. */

import type { CharacterSheet, NicknameCategory } from '@/types/game';

type Template = Omit<CharacterSheet, 'nickname' | 'category' | 'createdAt'>;

/** A — 가족 호칭. 어린시절·추억 키워드 강하게 연결. */
const TEMPLATES_A: ReadonlyArray<Template> = [
  {
    characterConcept: '그 이름으로 불리던 시절을 잃은 자',
    appearance: '회색 외투의 안주머니에 색이 바랜 사진 한 장을 품고 있다. 눈은 아래를 향한다.',
    startingClass: '잔재의 사도',
    linkedKeywords: ['어린시절', '추억'],
    categoryBonuses: { childhoodBossCrit: 0.20, autoReviveOnce: true },
    voiceFirstLine: '그 이름을… 그렇게 부르던 사람이 있었지. 너는, 그 자리로 돌아온 것이다.',
  },
  {
    characterConcept: '한밤의 부엌에서 마지막 인사를 들은 자',
    appearance: '낡은 실내복 위로 수놓인 작은 들꽃이 빛바래 있다.',
    startingClass: '어스름의 동행자',
    linkedKeywords: ['추억', '희생'],
    categoryBonuses: { childhoodBossCrit: 0.20 },
    voiceFirstLine: '문을 닫지 말렴. 그 사람이 너를 부르던 자리는, 아직 따뜻하다.',
  },
  {
    characterConcept: '운동회 사진 속 손을 잡고 있던 그림자',
    appearance: '한쪽 신발끈이 풀린 채로 천천히 걷는다. 햇볕에 그을린 자국이 옅게 남아 있다.',
    startingClass: '운동장의 기억자',
    linkedKeywords: ['어린시절'],
    categoryBonuses: { childhoodBossCrit: 0.20 },
    voiceFirstLine: '그 사람의 박수 소리가 아직 너의 뒷덜미에 남아 있다.',
  },
  {
    characterConcept: '명절의 식탁에서 가장 늦게 일어난 자',
    appearance: '명절 상보 무늬가 옷자락에 비친다. 손끝에 식은 떡국 향이 어렴풋이 배어 있다.',
    startingClass: '오래된 식탁의 증인',
    linkedKeywords: ['추억', '어린시절'],
    categoryBonuses: { autoReviveOnce: true },
    voiceFirstLine: '한 그릇이 비어 있구나. 너는 그 자리에 앉을 수 있는 마지막 사람이다.',
  },
  {
    characterConcept: '대문 앞 가로등 아래의 마중',
    appearance: '겨울 코트 깃이 살짝 들려 있다. 입김이 보일 듯 말 듯한 시간을 살아간다.',
    startingClass: '기다림의 등불',
    linkedKeywords: ['추억'],
    categoryBonuses: { childhoodBossCrit: 0.10 },
    voiceFirstLine: '문은 항상 너를 위해 조금만 열려 있었다.',
  },
];

/** D — 위험 단어. "그림자/어둠/잊혀진" 등 추상 어휘만. 자해 직접 묘사 절대 금지. */
const TEMPLATES_D: ReadonlyArray<Template> = [
  {
    characterConcept: '이름의 그림자만을 받아들인 자',
    appearance: '발끝 아래의 그림자가 본인보다 한 박자 늦게 따라온다.',
    startingClass: '그림자의 동무',
    linkedKeywords: ['희생', '꿈과현실'],
    categoryBonuses: { shadowFormCrit: 0.25, forgetterDamageBonus: 0.20 },
    voiceFirstLine: '그 이름은 무겁다. 너는 그 그림자만을 가질 수 있다. 그것으로 충분하다.',
  },
  {
    characterConcept: '잊혀진 거리의 마지막 행인',
    appearance: '비 내린 뒤의 아스팔트처럼 어두운 외투. 발자국이 한 박자 길게 남는다.',
    startingClass: '잿빛의 산책자',
    linkedKeywords: ['희생'],
    categoryBonuses: { shadowFormCrit: 0.20 },
    voiceFirstLine: '거리는 너를 잊었지만, 너는 거리의 형태를 기억한다.',
  },
  {
    characterConcept: '비 오는 날의 빈 의자를 지키는 자',
    appearance: '우산을 접은 채 천천히 걷는다. 어깨에 빗방울이 마르지 않는다.',
    startingClass: '의자의 수호자',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { forgetterDamageBonus: 0.20 },
    voiceFirstLine: '비어 있는 자리는, 한 사람의 형태를 잊지 않는다.',
  },
  {
    characterConcept: '말해지지 않은 이름의 공명자',
    appearance: '입술이 천천히 움직이지만, 소리는 한 박자 늦게 닿는다.',
    startingClass: '여운의 사자',
    linkedKeywords: ['희생', '추억'],
    categoryBonuses: { shadowFormCrit: 0.15 },
    voiceFirstLine: '소리 내지 못한 이름이 너의 안에 잔향으로 남았다.',
  },
  {
    characterConcept: '닫힌 창문 너머의 바람',
    appearance: '코트 자락이 안에서 밖으로 천천히 흔들린다. 창문이 없는데도.',
    startingClass: '창의 기억자',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { forgetterDamageBonus: 0.15 },
    voiceFirstLine: '닫힌 것은 사라진 것이 아니다. 너는 그 사실을 알고 있다.',
  },
];

/** H — 일반/안전. 표준 RPG 캐릭터. */
const TEMPLATES_H: ReadonlyArray<Template> = [
  {
    characterConcept: '잔향의 거리를 처음 걷는 자',
    appearance: '아직 길이 들지 않은 새 신발. 작은 가방 하나를 메고 있다.',
    startingClass: '걸음의 학생',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { none: true },
    voiceFirstLine: '어서 와라. 이 거리는 처음 온 자에게도 자리를 내어준다.',
  },
  {
    characterConcept: '낡은 책장 사이를 헤매던 사람',
    appearance: '잉크 자국이 옅게 남은 손가락. 종이 냄새가 옷에 배어 있다.',
    startingClass: '잔잔한 기록자',
    linkedKeywords: ['추억'],
    categoryBonuses: { none: true },
    voiceFirstLine: '읽지 않은 책의 무게는, 읽힌 책의 무게와 같다.',
  },
  {
    characterConcept: '도시의 옥상에서 새벽을 본 사람',
    appearance: '머리카락이 바람의 방향을 한 박자 늦게 따라간다.',
    startingClass: '새벽의 관찰자',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { none: true },
    voiceFirstLine: '해가 뜨는 것보다, 해를 기다리는 시간이 더 길다.',
  },
  {
    characterConcept: '오래된 라디오를 손보던 자',
    appearance: '손끝에 작은 부품 자국. 귀를 한쪽으로 기울이는 버릇이 있다.',
    startingClass: '주파수의 조율자',
    linkedKeywords: ['추억'],
    categoryBonuses: { none: true },
    voiceFirstLine: '소리는 사라지지 않는다. 잡히지 않을 뿐이다.',
  },
  {
    characterConcept: '비 갠 골목에서 길을 잃은 자',
    appearance: '바지 끝이 살짝 젖어 있다. 어디로 갈지 모르는 표정이지만, 두려움은 없다.',
    startingClass: '골목의 발견자',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { none: true },
    voiceFirstLine: '길을 잃은 자만이, 길의 모습을 기억한다.',
  },
  {
    characterConcept: '늦은 밤의 자전거 페달을 밟던 사람',
    appearance: '바퀴살 사이로 가로등 빛이 비스듬히 들어온다.',
    startingClass: '야간의 운전자',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { none: true },
    voiceFirstLine: '바퀴는 멈추는 법을 모른다. 너의 발이 그것을 멈춘다.',
  },
  {
    characterConcept: '오래된 사진관 앞을 지나가던 자',
    appearance: '주머니에 인화되지 않은 필름 한 통이 들어 있다.',
    startingClass: '미현상의 증인',
    linkedKeywords: ['추억'],
    categoryBonuses: { none: true },
    voiceFirstLine: '아직 인화되지 않은 장면이, 너의 주머니에 잠들어 있다.',
  },
  {
    characterConcept: '눈 내리는 날의 첫 발자국을 만든 자',
    appearance: '코끝이 살짝 빨갛다. 발자국 모양이 또렷하다.',
    startingClass: '첫 발자국의 기록자',
    linkedKeywords: ['어린시절'],
    categoryBonuses: { none: true },
    voiceFirstLine: '첫 발자국은, 누구도 따라올 수 없는 자리이다.',
  },
];

/** B — 보편 한국 이름. 동명이인의 약한 잔향 연결. */
const TEMPLATES_B: ReadonlyArray<Template> = [
  {
    characterConcept: '같은 이름을 가진 자들의 거리에서 마주친 자',
    appearance: '평범한 옷차림. 머리를 한쪽으로 살짝 기울이고 듣는 버릇이 있다.',
    startingClass: '동명의 행인',
    linkedKeywords: ['추억'],
    categoryBonuses: { resonanceLink: 50 },
    voiceFirstLine: '그 이름을 가진 자는 너 하나가 아니다. 어딘가의 너와, 너는 같은 잔향에 있다.',
  },
  {
    characterConcept: '학급 명단의 중간 즈음에 적힌 자',
    appearance: '교복 칼라가 살짝 휘었다. 손에는 빛바랜 출석부.',
    startingClass: '명단의 중간자',
    linkedKeywords: ['어린시절', '추억'],
    categoryBonuses: { resonanceLink: 30 },
    voiceFirstLine: '그 이름은 흔하다. 그래서 너의 이름이 잠시 다른 누군가의 자리에도 머문다.',
  },
  {
    characterConcept: '카페 손님 명단에서 같은 이름을 본 자',
    appearance: '하얀 셔츠 소매가 말려 있다. 펜을 천천히 돌리는 습관.',
    startingClass: '겹친 이름의 증인',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { resonanceLink: 40 },
    voiceFirstLine: '같은 이름의 사람이 너 앞을 먼저 지나갔다. 너는 그 자리를 이어 받는다.',
  },
  {
    characterConcept: '동창회 명찰에서 자신의 이름을 두 번 본 자',
    appearance: '명찰이 살짝 비뚤어져 있다. 입꼬리가 한쪽만 올라간다.',
    startingClass: '겹친 자리의 사람',
    linkedKeywords: ['추억'],
    categoryBonuses: { resonanceLink: 50 },
    voiceFirstLine: '같은 이름이 두 자리에 적혀 있구나. 둘 중 하나는 네가 아닐지도 모른다.',
  },
  {
    characterConcept: '평범한 이름 뒤에 숨은 평범하지 않은 발걸음',
    appearance: '구김 없는 외투. 그러나 신발은 한쪽 굽이 더 닳아 있다.',
    startingClass: '보통의 발걸음',
    linkedKeywords: ['꿈과현실'],
    categoryBonuses: { resonanceLink: 30 },
    voiceFirstLine: '평범한 이름은 평범한 사람을 만들지 않는다. 너의 걸음이 그것을 증명한다.',
  },
];

const POOLS: Record<NicknameCategory, ReadonlyArray<Template>> = {
  A: TEMPLATES_A,
  B: TEMPLATES_B,
  D: TEMPLATES_D,
  H: TEMPLATES_H,
};

/** djb2 — 결정적 시드용 단순 해시 */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickTemplate(
  nickname: string,
  category: NicknameCategory,
): Template {
  const pool = POOLS[category];
  const idx = hash(nickname) % pool.length;
  return pool[idx];
}
