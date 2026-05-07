-- 0009_user_wiki_code.sql — 잔향 캐릭터 코드 (plan9 영감)
--
-- 6자리 base32 코드 (사람이 읽기 쉬운 알파벳, 0/1/I/O 제외).
-- 친구가 코드로 내 잔향 wiki 일부를 볼 수 있음 — Phase 2에서 *공감 미션*
-- (코드로 친구의 잊혀진 자 만나기) 로 확장.
--
-- 영혼 4번(위로하는 게임) 톤 유지: 경쟁 X, 공유 O.
--
-- Refs: 30일 sprint Week 2 (plan9.kr/battle 영감 도입)

ALTER TABLE user_wiki ADD COLUMN nickname_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wiki_code ON user_wiki(nickname_code) WHERE nickname_code IS NOT NULL;
