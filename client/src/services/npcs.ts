/* NPC 시스템 — 잊혀진 자들과의 만남 (v2.3 §NPC 동료 Phase 0).
 *
 * Phase 0: 4 NPC, 성격 임의 부여, 버튼 상호작용, 이미지 placeholder
 * Phase 1+:
 *   - LLM 동적 대화 (성격 prompt + 사용자 닉네임 컨텍스트)
 *   - Nano Banana Pro 이미지 생성 (NPC별 1장)
 *   - 호감도 시스템 (대화 누적 → 합류 → 길드)
 *
 * 데이터 구조는 Phase 1+ 호환 — image 필드만 비어있고 textOnly placeholder.
 */

export type NPCMood =
  | 'warm' // 따뜻함 — 시장의 노파
  | 'distant' // 거리감 — 거리의 음유시인
  | 'familiar' // 친숙함 — 한 번도 본 적 없던 친구
  | 'silent'; // 침묵 — 잊혀진 자 (NPC 형태)

export interface NPC {
  id: string;
  /** 표시용 이름 */
  name: string;
  /** 영문 — 인게임 워딩 사전 일관성 */
  nameEn: string;
  /** 짧은 역할 */
  role: string;
  /** 성격 한 줄 */
  personality: string;
  /** 첫 발화 — 대화 진입 시 자동 노출 */
  firstLine: string;
  /** 대화 옵션 (Phase 0는 결정적 응답 / Phase 1+ LLM 동적). 4개 한정 */
  topics: ReadonlyArray<{
    label: string;
    /** NPC의 응답 — 짧은 한 줄 또는 두 줄 */
    response: string;
  }>;
  /** 분위기 색조 — UI 색감 변주 */
  mood: NPCMood;
  /** Phase 1+ 이미지 URL. 현재는 null + emoji/symbol fallback */
  imageUrl: string | null;
  /** 대체 시각 — 이미지 없을 때 표시할 1자 한자 또는 기호 */
  avatarSymbol: string;
}

export const NPCS: ReadonlyArray<NPC> = [
  {
    id: 'market-elder',
    name: '시장의 노파',
    nameEn: 'the Market Elder',
    role: '기억의 시장 좌판 주인',
    personality: '따뜻하지만 무겁다. 잊혀진 자들의 조각을 받아 잠시의 위로로 바꾼다.',
    firstLine:
      '오느라 수고했지. … 손에 쥔 것 좀 보여주오. 내 가게는 그런 것을 받는 곳이라오.',
    topics: [
      {
        label: '시장이란 어떤 곳입니까',
        response:
          '잊혀진 자들이 남긴 조각이 모이는 곳이지. 너희는 위로를 사 가고, 나는 그 조각을 거리로 흘려보낸다오.',
      },
      {
        label: '당신은 누구입니까',
        response:
          '오래 전에 이 거리에 머물렀던 자라네. 이제는 좌판이 나의 자리지. 너희를 보는 것이 나의 일이야.',
      },
      {
        label: '잠시 쉬다 갑니다',
        response: '그래. 향로가 너를 데우는 동안, 좌판은 너를 기다린다.',
      },
    ],
    mood: 'warm',
    imageUrl: null,
    avatarSymbol: '老',
  },
  {
    id: 'street-bard',
    name: '거리의 음유시인',
    nameEn: 'the Street Bard',
    role: '잊혀진 자들의 이야기를 노래로 옮기는 자',
    personality: '거리감 있고 시적. 같은 자리에 두 번 머물지 않는다.',
    firstLine:
      '— 너의 발소리에 무게가 있구나. 그 무게의 이름을 한 줄로 줄여 노래로 만들 수 있을까.',
    topics: [
      {
        label: '거리에는 무엇이 흐릅니까',
        response:
          '잊혀진 자들의 이름이지. 그 이름들이 한 박자씩 늦게 너를 따라온다오.',
      },
      {
        label: '잊혀진 자란 누구입니까',
        response:
          '한때 이름이었던 자들. 지금은 안개가 되어 거리를 떠도는 자들. 너의 이름도 언젠가 그들 중 하나가 될지 모르지.',
      },
      {
        label: '당신의 노래를 듣고 싶습니다',
        response:
          '— "거리는 너의 이름을 한 번 부르고, 두 번 잊고, 세 번째에 다시 부른다." 한 줄이면 됐지.',
      },
    ],
    mood: 'distant',
    imageUrl: null,
    avatarSymbol: '吟',
  },
  {
    id: 'forgotten-friend',
    name: '한 번도 본 적 없던 친구',
    nameEn: 'the Friend You Never Met',
    role: '너의 다른 시기를 살았을 누군가',
    personality:
      '친숙하지만 너는 그를 알아보지 못한다. 그는 너를 알아보는 것 같다.',
    firstLine:
      '— 오랜만이야. 너는 나를 모르겠지만, 나는 너를 안다. 너의 이름이 거리에 닿는 박자가 익숙해서.',
    topics: [
      {
        label: '우리가 만난 적이 있습니까',
        response:
          '있을 수도, 없을 수도. 너의 한 시절에 내가 잠깐 자리에 있었을 뿐이지. 너는 그 자리를 잊었어.',
      },
      {
        label: '당신은 어떻게 나를 압니까',
        response:
          '너의 이름을 거리에서 들었지. 거리는 한 번 들은 이름을 오래 기억한다. 나는 거리에 더 오래 있었을 뿐이야.',
      },
      {
        label: '함께 갈 수 있습니까',
        response:
          '아직은 아니야. 너의 잔향이 더 깊어지면, 그때 한 번 더 마주칠지도 모르지. 그날엔 우리가 같이 걸을 수 있을 거야.',
      },
    ],
    mood: 'familiar',
    imageUrl: null,
    avatarSymbol: '友',
  },
  {
    id: 'silent-forgetter',
    name: '잊혀진 자',
    nameEn: 'the Forgetter',
    role: '거리의 끝에 앉은 모자를 깊게 눌러 쓴 자',
    personality:
      '멜랑콜리, 부드럽지만 거리감. 너의 조각을 알아본다.',
    firstLine:
      '— 그 조각… 기억나는 것 같기도 하고. 내려놓아도 좋아. 무게가 너를 따라다니면 안 되니까.',
    topics: [
      {
        label: '당신은 누구입니까',
        response:
          '거리에 너무 오래 있어 이름을 잊은 자라네. 너는 잊지 마시오. 그게 너의 일이지.',
      },
      {
        label: '왜 모자를 그렇게 눌러 쓰십니까',
        response:
          '얼굴이 너에게 익숙하면 너도 잊혀진 자가 될까봐. 거리는 그렇게 한다오.',
      },
      {
        label: '잠시 함께 앉아도 됩니까',
        response: '… 그래. 잠시는, 거리도 너희 둘을 잊을 거야.',
      },
    ],
    mood: 'silent',
    imageUrl: null,
    avatarSymbol: '忘',
  },
];

const MOOD_COLOR: Record<NPCMood, string> = {
  warm: 'text-origin', // 빛 바랜 황금
  distant: 'text-resonance', // 라벤더
  familiar: 'text-fg-primary',
  silent: 'text-fg-muted',
};

export function colorForMood(mood: NPCMood): string {
  return MOOD_COLOR[mood];
}

/** id로 NPC 조회. 매칭 없으면 null. */
export function findNPC(id: string): NPC | null {
  return NPCS.find((n) => n.id === id) ?? null;
}
