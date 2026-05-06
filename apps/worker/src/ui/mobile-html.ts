/**
 * 잔향 모바일 친화 HTML UI — Phase 1.6 풀 흐름.
 *
 * 단일 페이지: 닉네임 → 캐릭터 → 잊혀진 자 만남 → 5턴 전투 → 결말 → 잔잔 누적.
 * 같은 Worker의 /api/character/analyze + /api/combat/start + /api/combat/turn 호출.
 */

export const MOBILE_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<meta name="theme-color" content="#0F0E14" />
<title>잔향 — 닉네임이 잔향이 된다</title>
<style>
  :root {
    --bg-primary: #0F0E14;
    --bg-secondary: #1B1A23;
    --bg-elevated: #2A2935;
    --fg-primary: #E8E3D5;
    --fg-muted: #A8A39A;
    --fg-dim: #6B6760;
    --resonance: #B89DD0;
    --resonance-deep: #8E72A8;
    --origin: #D4A574;
    --danger: #C44848;
    --sky: #4870C4;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg-primary);
    color: var(--fg-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
    line-height: 1.6;
    min-height: 100dvh;
    overscroll-behavior: contain;
  }
  body { padding: 24px 18px 40px; max-width: 480px; margin: 0 auto; }

  header { text-align: center; padding-top: 16px; margin-bottom: 24px; }
  .han { color: var(--fg-dim); font-size: 11px; letter-spacing: 0.5em; text-transform: uppercase; margin-bottom: 10px; }
  h1 { color: var(--resonance); font-size: 48px; margin: 0 0 4px; font-weight: 600; letter-spacing: -0.02em; }
  .subtitle { color: var(--fg-muted); font-style: italic; font-size: 13px; margin: 0; }

  .voice {
    border-left: 2px solid var(--resonance);
    padding: 8px 0 8px 14px; margin: 24px 0 12px;
  }
  .voice-label {
    color: var(--fg-dim); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 6px;
  }
  .voice-text { color: var(--fg-primary); font-size: 16px; }
  .voice-secondary { color: var(--fg-muted); font-size: 14px; font-style: italic; margin-top: 10px; }

  /* Stage card — 모든 단계 공통 컨테이너 */
  .stage { margin: 18px 0; }
  .stage.hidden { display: none; }

  .form { margin-top: 18px; }
  input[type="text"] {
    width: 100%;
    background: rgba(27, 26, 35, 0.5);
    border: 1px solid var(--bg-elevated);
    border-radius: 8px;
    padding: 13px 14px;
    color: var(--fg-primary);
    font-size: 17px;
    font-family: inherit;
    outline: none;
    -webkit-appearance: none;
  }
  input[type="text"]:focus { border-color: var(--resonance); }
  input[type="text"]::placeholder { color: var(--fg-dim); }
  textarea {
    width: 100%;
    background: rgba(27, 26, 35, 0.5);
    border: 1px solid var(--bg-elevated);
    border-radius: 8px;
    padding: 11px 13px;
    color: var(--fg-primary);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    resize: vertical;
    min-height: 56px;
  }
  textarea:focus { border-color: var(--resonance); }
  .counter {
    text-align: right; color: var(--fg-dim); font-size: 11px; margin-top: 6px;
  }

  button {
    width: 100%;
    margin-top: 12px;
    background: var(--resonance);
    color: var(--bg-primary);
    border: none;
    border-radius: 8px;
    padding: 13px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    font-family: inherit;
    cursor: pointer;
    transition: background 120ms;
  }
  button:active { background: var(--resonance-deep); }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .ghost {
    background: transparent;
    color: var(--fg-muted);
    font-size: 13px;
    margin-top: 6px;
  }
  .small {
    background: var(--bg-elevated);
    color: var(--fg-primary);
    font-size: 13px;
    padding: 9px;
  }
  .row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .row3 button { margin-top: 0; }
  .danger-btn { background: var(--danger); }
  .danger-btn:active { background: #a83838; }
  .sky-btn { background: var(--sky); color: var(--fg-primary); }
  .sky-btn:active { background: #355590; }

  /* 캐릭터 카드 */
  .card {
    border: 1px solid rgba(184, 157, 208, 0.4);
    border-radius: 10px;
    padding: 16px;
    background: rgba(27, 26, 35, 0.4);
  }
  .card-label {
    color: var(--fg-dim); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  .voice-address {
    color: var(--resonance); font-size: 17px; font-weight: 600; margin: 0 0 6px;
  }
  .meta {
    color: var(--fg-muted); font-size: 13px; font-style: italic; margin: 0 0 14px;
  }
  .field {
    border-top: 1px solid var(--bg-elevated);
    padding-top: 10px; margin-top: 10px;
  }
  .field-label {
    color: var(--fg-dim); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    margin-bottom: 4px;
  }
  .field-value { color: var(--fg-primary); font-size: 14px; line-height: 1.6; }
  .keywords { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .keyword {
    background: var(--bg-elevated); color: var(--fg-muted);
    padding: 4px 10px; border-radius: 999px; font-size: 12px;
  }
  .boss-list { margin: 0; padding: 0; list-style: none; }
  .boss-list li { padding: 5px 0; color: var(--fg-muted); font-size: 13px; }
  .boss-num { color: var(--resonance); font-weight: 600; margin-right: 6px; }
  .meta-cost {
    margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--bg-elevated);
    color: var(--fg-dim); font-size: 11px; text-align: center;
  }

  /* 전투 영역 */
  .combat-card {
    border: 1px solid var(--danger);
    border-radius: 10px;
    padding: 14px;
    background: rgba(196, 72, 72, 0.05);
    margin: 16px 0;
  }
  .combat-card.victory { border-color: var(--origin); background: rgba(212, 165, 116, 0.05); }
  .combat-card.fled { border-color: var(--resonance); background: rgba(184, 157, 208, 0.05); }
  .enemy-name {
    color: var(--danger); font-size: 15px; font-weight: 600; margin: 0 0 4px;
  }
  .enemy-desc {
    color: var(--fg-muted); font-size: 13px; font-style: italic; margin: 0 0 12px;
  }
  .hp-bars { display: flex; gap: 12px; margin-bottom: 12px; font-size: 12px; }
  .hp-bar { flex: 1; }
  .hp-bar-label { color: var(--fg-dim); margin-bottom: 4px; font-size: 10px; letter-spacing: 0.1em; }
  .hp-bar-bg {
    background: var(--bg-elevated);
    border-radius: 999px; height: 6px; overflow: hidden;
  }
  .hp-bar-fill {
    background: var(--danger);
    height: 100%; transition: width 400ms ease;
  }
  .hp-bar-fill.player { background: var(--resonance); }
  .hp-num { color: var(--fg-muted); font-size: 11px; margin-top: 3px; text-align: right; }

  .turn-info {
    color: var(--fg-dim); font-size: 11px; letter-spacing: 0.1em;
    text-align: center; margin: 8px 0;
  }
  .resonance-pill {
    display: inline-block;
    background: var(--resonance);
    color: var(--bg-primary);
    padding: 2px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 600;
    margin-left: 6px;
  }

  .log {
    border-left: 2px solid var(--resonance);
    background: rgba(27, 26, 35, 0.4);
    padding: 10px 0 10px 12px;
    margin-top: 12px;
    max-height: 240px; overflow-y: auto;
  }
  .log-line {
    color: var(--fg-muted); font-size: 13px; line-height: 1.55; margin-bottom: 6px;
    white-space: pre-wrap;
  }
  .log-line.echo { color: var(--fg-dim); padding-left: 14px; font-style: italic; }

  .outcome-box {
    border-radius: 8px;
    padding: 14px;
    margin: 14px 0;
    text-align: center;
  }
  .outcome-victory { background: rgba(212, 165, 116, 0.1); color: var(--origin); }
  .outcome-defeat { background: rgba(196, 72, 72, 0.1); color: var(--danger); }
  .outcome-fled { background: rgba(184, 157, 208, 0.08); color: var(--resonance); }
  .outcome-stalemate { background: rgba(168, 163, 154, 0.08); color: var(--fg-muted); }
  .outcome-title { font-weight: 600; font-size: 16px; margin-bottom: 6px; }
  .outcome-text { font-size: 13px; font-style: italic; }

  /* 에러 / 로딩 */
  .error {
    border-left: 2px solid var(--danger);
    padding: 8px 14px;
    margin-top: 12px;
    color: var(--danger);
    font-size: 14px;
  }
  .loading { color: var(--fg-muted); text-align: center; margin: 12px 0; font-style: italic; font-size: 13px; }
  .dot {
    display: inline-block; animation: pulse 1.4s ease-in-out infinite;
    color: var(--resonance);
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

  footer {
    margin-top: 36px; text-align: center;
    color: var(--fg-dim); font-size: 11px; letter-spacing: 0.05em;
  }
  .footer-quote { color: var(--fg-muted); font-style: italic; margin-bottom: 8px; }
  .footer-link { color: var(--resonance); text-decoration: none; border-bottom: 1px dotted var(--resonance); }
</style>
</head>
<body>
  <header>
    <div class="han">殘響</div>
    <h1>잔향</h1>
    <p class="subtitle">Echoes of a Forgotten Self</p>
  </header>

  <!-- Stage 1: 닉네임 입력 -->
  <div id="stage-nickname" class="stage">
    <div class="voice">
      <div class="voice-label">목소리</div>
      <div class="voice-text">…기억나요?</div>
      <div class="voice-secondary">잔향이 — 너를 기다린다.<br/>이름을 한 줄, 입력해줘.</div>
    </div>
    <div class="form">
      <input
        id="nickname"
        type="text"
        placeholder="…회사다니기싫은김대리"
        maxlength="20"
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
      />
      <div class="counter"><span id="count">0</span> / 20</div>
      <button id="submit-nickname" type="button">잔향에 들어간다</button>
    </div>
  </div>

  <!-- Stage 2: 캐릭터 시트 + 전투 진입 CTA -->
  <div id="stage-character" class="stage hidden"></div>

  <!-- Stage 3: 전투 화면 -->
  <div id="stage-combat" class="stage hidden"></div>

  <!-- Stage 4: 결말 -->
  <div id="stage-result" class="stage hidden"></div>

  <!-- Stage 5: 상점 -->
  <div id="stage-shop" class="stage hidden"></div>

  <!-- 공통 영역 -->
  <div id="error" class="error" style="display:none"></div>
  <div id="loading" class="loading" style="display:none">
    <span class="dot">·</span><span class="dot">·</span><span class="dot">·</span>
    <span id="loading-text">잔향이 듣고 있어요</span>
  </div>

  <!-- 안전 모달 (자살예방법 §27조의8) — 5초 dwell + 복수 채널 (1393 + 청소년 1388 + 1577-0199) -->
  <div id="safety-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:1000;align-items:center;justify-content:center;padding:20px">
    <div style="max-width:340px;background:var(--bg-elevated);border-radius:14px;padding:22px;border:1px solid rgba(255,180,180,0.3)">
      <div style="font-size:14px;color:var(--fg-muted);margin-bottom:6px">잔향이 한 번 멈추고 너를 본다.</div>
      <div style="font-size:18px;font-weight:600;color:var(--fg-primary);margin-bottom:14px;line-height:1.4">너의 결을 먼저 듣고 싶어요.</div>
      <div style="font-size:14px;color:var(--fg-primary);line-height:1.7;margin-bottom:18px">
        혼자 마주하기 힘든 무게가 있다면<br/>
        <strong style="font-size:16px">자살예방상담 <a href="tel:1393" style="color:var(--resonance);text-decoration:underline">1393</a></strong> (24시간 무료)<br/>
        <span style="color:var(--fg-muted);font-size:12px">청소년: <a href="tel:1388" style="color:var(--fg-muted)">1388</a> · 정신건강: <a href="tel:1577-0199" style="color:var(--fg-muted)">1577-0199</a></span><br/>
        <span style="color:var(--fg-dim);font-size:12px">— 잔향계 너머의 사람도 너의 잔향을 듣는다.</span>
      </div>
      <div style="display:flex;gap:8px">
        <a href="tel:1393" style="flex:1;text-align:center;padding:12px;background:var(--resonance);color:#0F0E14;border-radius:8px;text-decoration:none;font-weight:600">1393 전화하기</a>
        <button id="safety-close" type="button" class="ghost" style="flex:1;padding:12px" disabled>닫기</button>
      </div>
    </div>
  </div>

  <footer>
    <div class="footer-quote">"잔향이 — 잠시, 머물렀어요."</div>
    <div>잔향(Resonance) · Phase 1.7 · Gemini Flash-Lite</div>
  </footer>

<script>
(function () {
  // ────────────────────────────────────────────────────
  // 상태
  // ────────────────────────────────────────────────────
  var state = {
    userId: 'web_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    nickname: '',
    analysis: null,
    nicknameCode: null,
    combat: null,
    finalOutcome: null,
    stamina: null,
  };

  // ────────────────────────────────────────────────────
  // DOM
  // ────────────────────────────────────────────────────
  var $nickname = document.getElementById('nickname');
  var $count = document.getElementById('count');
  var $submitNickname = document.getElementById('submit-nickname');
  var $stageNickname = document.getElementById('stage-nickname');
  var $stageCharacter = document.getElementById('stage-character');
  var $stageCombat = document.getElementById('stage-combat');
  var $stageResult = document.getElementById('stage-result');
  var $stageShop = document.getElementById('stage-shop');
  var $error = document.getElementById('error');
  var $loading = document.getElementById('loading');
  var $loadingText = document.getElementById('loading-text');

  // ────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }
  function showError(msg) {
    $error.textContent = msg;
    $error.style.display = '';
  }
  function clearError() { $error.style.display = 'none'; $error.textContent = ''; }

  // 잔잔(殘殘) 임계 — Design+Story layer 2 (대화 깊이 단계 라벨)
  function tierLabel(resonance) {
    if (resonance >= 100) return '원의 답';
    if (resonance >= 60) return '오래된 기억';
    if (resonance >= 30) return '공감 한 마디';
    return '평이';
  }

  // 스테미나 게이지 (Phase 2 BM)
  function buildStaminaBar(s) {
    var pct = Math.max(0, Math.min(100, (s.current / s.max_daily) * 100));
    var diff = s.willResetAtMs - Date.now();
    var hh = Math.max(0, Math.floor(diff / 3600000));
    var mm = Math.max(0, Math.floor((diff % 3600000) / 60000));
    var resetText = hh > 0 ? hh + '시간 ' + mm + '분 후' : mm + '분 후';
    var color = pct > 30 ? 'var(--resonance)' : '#ffb1b1';
    return '<div style="margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">' +
        '<span style="color:var(--fg-dim);font-size:10px;letter-spacing:3px;text-transform:uppercase">잔향</span>' +
        '<span style="color:var(--fg-muted);font-size:11px">' + s.current + ' / ' + s.max_daily + ' · ' + resetText + ' 회복 · <a href="#" id="open-shop-link" style="color:var(--resonance);text-decoration:underline">상점</a></span>' +
      '</div>' +
      '<div style="height:6px;background:var(--bg-elevated);border-radius:3px;overflow:hidden">' +
        '<div style="height:100%;background:' + color + ';width:' + pct + '%;transition:width 600ms cubic-bezier(.4,0,.6,1)"></div>' +
      '</div>' +
    '</div>';
  }

  // 자살예방법 §27조의8 — safety_concern='high' 시 1393 안내 모달
  // 5초 dwell (X 비활성) + 복수 채널 (1393 / 1388 / 1577-0199)
  function showSafetyModal() {
    var $m = document.getElementById('safety-modal');
    if (!$m) return;
    $m.style.display = 'flex';
    var $close = document.getElementById('safety-close');
    if ($close) {
      $close.disabled = true;
      $close.textContent = '닫기 (5)';
      var seconds = 5;
      var iv = setInterval(function () {
        seconds--;
        if (seconds > 0) { $close.textContent = '닫기 (' + seconds + ')'; }
        else {
          clearInterval(iv);
          $close.disabled = false;
          $close.textContent = '닫기';
        }
      }, 1000);
      $close.onclick = function () {
        if ($close.disabled) return;
        clearInterval(iv);
        $m.style.display = 'none';
      };
    }
  }
  function setLoading(on, text) {
    $loading.style.display = on ? '' : 'none';
    if (text) $loadingText.textContent = text;
  }
  function api(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Dev-User-Id': state.userId,
      },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().then(function (b) { return { res: res, body: b }; });
    });
  }

  $nickname.addEventListener('input', function () {
    $count.textContent = $nickname.value.length;
  });

  // ────────────────────────────────────────────────────
  // Stage 1 → Stage 2: 닉네임 분석
  // ────────────────────────────────────────────────────
  $submitNickname.addEventListener('click', submitNickname);
  $nickname.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitNickname();
  });

  function submitNickname() {
    var n = $nickname.value.trim();
    if (n.length < 1 || n.length > 20) {
      showError('닉네임은 1~20자여야 합니다.');
      return;
    }
    clearError();
    state.nickname = n;
    setLoading(true, '잔향이 너의 이름을 듣고 있어요');
    $submitNickname.disabled = true;

    api('/api/character/analyze', { nickname: n }).then(function (r) {
      $submitNickname.disabled = false;
      setLoading(false);
      if (!r.res.ok || !r.body.success) {
        var msg = r.body && r.body.error ? r.body.error : '서버 오류 (' + r.res.status + ')';
        if (r.body && r.body.code === 'RATE_LIMITED' && r.body.retry_after_ms) {
          msg += ' (' + Math.round(r.body.retry_after_ms / 60000) + '분 후 다시)';
        }
        showError(msg);
        return;
      }
      state.analysis = r.body.user_wiki.nickname_analysis;
      state.nicknameCode = r.body.user_wiki.nickname_code || null;
      if (r.body.stamina) state.stamina = r.body.stamina;
      // 닉네임에서 자살 위험 신호 감지 시 1393 안내 (자살예방법 §27조의8)
      if (state.analysis && state.analysis.safety_concern === 'high') {
        showSafetyModal();
      }
      state.analysisMeta = r.body.meta;
      renderCharacter();
      hide($stageNickname);
      show($stageCharacter);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function (err) {
      $submitNickname.disabled = false;
      setLoading(false);
      showError('네트워크 오류: ' + err.message);
    });
  }

  // ────────────────────────────────────────────────────
  // Stage 2: 캐릭터 시트 렌더 + 전투 진입 CTA
  // ────────────────────────────────────────────────────
  function renderCharacter() {
    var a = state.analysis;
    var m = state.analysisMeta || {};
    var keywordsHtml = (a.주요키워드 || []).map(function (k) {
      return '<span class="keyword">' + escapeHtml(k) + '</span>';
    }).join('');
    var boss = a.스토리매칭 || {};
    var bossList = [
      ['1', '남겨진 거인 (30~40대 직장)', boss.보스1자리, boss.보스1회상],
      ['2', '흐르는 그림자 (20대 사랑)', boss.보스2자리],
      ['3', '미루는 학자 (17~19세 꿈)', boss.보스3자리],
      ['4', '떠난 친구들 (8~12세 우정)', boss.보스4자리],
      ['5', '원의 아이 (5~7세 첫 자기)', boss.보스5자리],
    ];
    var bossHtml = bossList.map(function (b) {
      var place = b[2] ? escapeHtml(b[2]) : '';
      var memory = b[3] ? '<br/><span style="color:var(--fg-dim);font-size:11px">↳ ' + escapeHtml(b[3]) + '</span>' : '';
      return '<li><span class="boss-num">' + b[0] + '</span>' + escapeHtml(b[1]) + '<br/>' +
        '<span style="color:var(--fg-muted);font-size:13px">' + place + '</span>' + memory + '</li>';
    }).join('');
    var costStr = m.cost_usd != null
      ? m.model + ' · in ' + m.input_tokens + ' / out ' + m.output_tokens + ' tok · ≈ $' + m.cost_usd.toFixed(6)
      : '';

    var metaParts = [a.추정직업, a.추정연령, a.정서적결].filter(function (s) { return !!s; });
    var metaLine = metaParts.length > 0 ? metaParts.map(function (s) { return escapeHtml(s); }).join(' · ') : '';
    var safetyHtml = a.safety_concern === 'high' ?
      '<div class="safety-banner" style="background:rgba(255,180,180,0.08);border:1px solid rgba(255,180,180,0.3);border-radius:8px;padding:10px;margin:10px 0;font-size:13px;color:#ffd1d1">' +
        '<strong>잔향이 한 번 멈추고 너를 본다.</strong><br/>' +
        '<span style="color:var(--fg-muted);font-size:12px">힘들면 자살예방상담 — 1393 (24시간 무료). 너의 결을 먼저 듣고 싶어요.</span>' +
      '</div>' : '';

    var staminaHtml = state.stamina ? buildStaminaBar(state.stamina) : '';
    $stageCharacter.innerHTML =
      staminaHtml +
      '<div class="card">' +
        '<div class="card-label">잔향이 본 너</div>' +
        '<div class="voice-address">' + escapeHtml(a.the_Voice_호칭 || '') + '</div>' +
        (metaLine ? '<div class="meta">' + metaLine + '</div>' : '') +
        safetyHtml +
        (a.description ?
          '<div class="field">' +
            '<div class="field-label">결</div>' +
            '<div class="field-value" style="line-height:1.6">' + escapeHtml(a.description) + '</div>' +
          '</div>' : '') +
        (keywordsHtml ?
          '<div class="field">' +
            '<div class="field-label">주요 키워드</div>' +
            '<div class="keywords">' + keywordsHtml + '</div>' +
          '</div>' : '') +
        (state.nicknameCode ?
          '<div class="field">' +
            '<div class="field-label">내 잔향 코드</div>' +
            '<div style="display:flex;gap:8px;align-items:center;margin-top:6px">' +
              '<span id="my-code" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:20px;letter-spacing:3px;color:var(--fg)">' +
              escapeHtml(state.nicknameCode) +
              '</span>' +
              '<button class="ghost" id="copy-code" type="button" style="font-size:12px;padding:4px 10px">복사</button>' +
            '</div>' +
            '<div style="color:var(--fg-dim);font-size:11px;margin-top:6px">친구가 이 코드로 너의 잔향을 들여다본다.</div>' +
          '</div>' : '') +
        (a.스토리매칭 ?
          '<div class="field">' +
            '<div class="field-label">5체 보스의 자리 — 시간 역행</div>' +
            '<ul class="boss-list">' + bossHtml + '</ul>' +
          '</div>' : '') +
        ((a.거점NPC말투 && a.거점NPC말투.차분한가게주인) ?
          '<div class="field">' +
            '<div class="field-label">차분한 가게 주인</div>' +
            '<div class="field-value" style="font-style:italic">"' +
            escapeHtml(a.거점NPC말투.차분한가게주인) +
            '"</div>' +
          '</div>' : '') +
        '<div class="meta-cost">' + escapeHtml(costStr) + '</div>' +
      '</div>' +
      '<div class="voice">' +
        '<div class="voice-label">목소리</div>' +
        '<div class="voice-text">…거리의 끝에서, 누군가 너를 기다린다.</div>' +
        '<div class="voice-secondary">잊혀진 자가 일어선다. 가까이 가볼래?</div>' +
      '</div>' +
      '<button id="enter-combat" type="button">잊혀진 자에게 다가간다</button>' +
      '<button class="ghost" id="reroll-analysis" type="button">잔향이 한 번 더 — 다시 듣기</button>' +
      '<button class="ghost" id="reset-from-character" type="button">← 다른 이름으로, 다시 거리에</button>';

    document.getElementById('enter-combat').addEventListener('click', startCombat);
    document.getElementById('reset-from-character').addEventListener('click', resetAll);
    var $shopLink = document.getElementById('open-shop-link');
    if ($shopLink) {
      $shopLink.addEventListener('click', function (e) { e.preventDefault(); openShop(); });
    }
    var $reroll = document.getElementById('reroll-analysis');
    if ($reroll) {
      $reroll.addEventListener('click', function () {
        var nick = state.analysis && state.analysis.nickname;
        if (!nick) return;
        clearError();
        setLoading(true, '잔향이 다시 듣고 있어요');
        api('/api/character/analyze', { nickname: nick }).then(function (r) {
          setLoading(false);
          if (!r.res.ok || !r.body.success) {
            showError('재분석 실패: ' + (r.body && r.body.error ? r.body.error : r.res.status));
            return;
          }
          state.analysis = r.body.user_wiki.nickname_analysis;
          state.nicknameCode = r.body.user_wiki.nickname_code || state.nicknameCode;
          if (state.analysis && state.analysis.safety_concern === 'high') showSafetyModal();
          renderCharacter();
        }).catch(function (err) {
          setLoading(false);
          showError('잔향이 — 다시 듣지 못했어요: ' + err.message);
        });
      });
    }
    var $copyBtn = document.getElementById('copy-code');
    if ($copyBtn) {
      $copyBtn.addEventListener('click', function () {
        var code = state.nicknameCode;
        if (!code) return;
        var done = function () {
          $copyBtn.textContent = '복사됨';
          setTimeout(function () { $copyBtn.textContent = '복사'; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(done).catch(done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = code; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
    }
  }

  // ────────────────────────────────────────────────────
  // Stage 3: 전투 시작
  // ────────────────────────────────────────────────────
  function startCombat() {
    clearError();
    setLoading(true, '거리의 끝에서 그림자가 일어선다');
    api('/api/combat/start', {}).then(function (r) {
      setLoading(false);
      if (!r.res.ok || !r.body.success) {
        showError('전투 진입 실패: ' + (r.body && r.body.error ? r.body.error : r.res.status));
        return;
      }
      state.combat = r.body.state;
      hide($stageCharacter);
      show($stageCombat);
      renderCombat();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function (err) {
      setLoading(false);
      showError('네트워크 오류: ' + err.message);
    });
  }

  function renderCombat() {
    var c = state.combat;
    var enemyHpPct = Math.max(0, Math.min(100, (c.enemy.hp / c.enemy.maxHp) * 100));
    var playerHpPct = Math.max(0, Math.min(100, (c.player.hp / c.player.maxHp) * 100));

    var logHtml = (c.log || []).map(function (line) {
      var isEcho = line.indexOf('  ↳') === 0;
      return '<div class="log-line' + (isEcho ? ' echo' : '') + '">' + escapeHtml(line) + '</div>';
    }).join('');

    $stageCombat.innerHTML =
      '<div class="combat-card">' +
        '<div class="card-label">잊혀진 자</div>' +
        '<div class="enemy-name">' + escapeHtml(c.enemy.name) + '</div>' +
        '<div class="enemy-desc">' + escapeHtml(c.enemy.description) + '</div>' +
        '<div class="hp-bars">' +
          '<div class="hp-bar">' +
            '<div class="hp-bar-label">잊혀진 자 HP</div>' +
            '<div class="hp-bar-bg"><div class="hp-bar-fill" style="width:' + enemyHpPct + '%"></div></div>' +
            '<div class="hp-num">' + c.enemy.hp + ' / ' + c.enemy.maxHp + '</div>' +
          '</div>' +
          '<div class="hp-bar">' +
            '<div class="hp-bar-label">너의 HP</div>' +
            '<div class="hp-bar-bg"><div class="hp-bar-fill player" style="width:' + playerHpPct + '%"></div></div>' +
            '<div class="hp-num">' + c.player.hp + ' / ' + c.player.maxHp + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="turn-info">턴 ' + (c.turn) + ' / 5 <span class="resonance-pill">잔잔 ' + c.resonance + ' · <span style="color:var(--resonance)">' + tierLabel(c.resonance) + '</span></span></div>' +
        '<div style="margin:10px 0 6px">' +
          '<div class="hp-bar-label" style="margin-bottom:4px">자유 텍스트 (선택, 최대 200자)</div>' +
          '<textarea id="user-text" maxlength="200" placeholder="…너에게 한 마디 — 자유롭게.&#10;빈 칸도 OK. 입력하면 잔향이 더 깊게 듣는다."></textarea>' +
          '<div class="counter"><span id="user-text-count">0</span> / 200</div>' +
        '</div>' +
        '<div class="row3">' +
          '<button id="act-attack" type="button" class="danger-btn">공격</button>' +
          '<button id="act-dialogue" type="button">대화</button>' +
          '<button id="act-flee" type="button" class="sky-btn">도망</button>' +
        '</div>' +
        (c.log && c.log.length > 0 ? '<div class="log">' + logHtml + '</div>' : '') +
      '</div>' +
      '<button class="ghost" id="reset-from-combat" type="button">← 처음으로</button>';

    var $userText = document.getElementById('user-text');
    var $userTextCount = document.getElementById('user-text-count');
    $userText.addEventListener('input', function () {
      $userTextCount.textContent = $userText.value.length;
    });

    document.getElementById('act-attack').addEventListener('click', function () { combatTurn('attack'); });
    document.getElementById('act-dialogue').addEventListener('click', function () { combatTurn('dialogue'); });
    document.getElementById('act-flee').addEventListener('click', function () { combatTurn('flee'); });
    document.getElementById('reset-from-combat').addEventListener('click', resetAll);
  }

  function combatTurn(action) {
    clearError();
    var $userText = document.getElementById('user-text');
    var userText = $userText && $userText.value ? $userText.value.trim() : '';
    setLoading(true, action === 'attack' ? '너의 손이 호선을 그린다' : action === 'dialogue' ? '너의 말이 안개에 닿는다' : '너의 발이 거리를 떠난다');
    var payload = { state: state.combat, action: action };
    if (userText) payload.userText = userText;
    api('/api/combat/turn', payload).then(function (r) {
      setLoading(false);
      if (!r.res.ok || !r.body.success) {
        showError('전투 호출 실패: ' + (r.body && r.body.error ? r.body.error : r.res.status));
        return;
      }
      state.combat = r.body.state;
      if (r.body.stamina) state.stamina = r.body.stamina;
      // safety_concern=high 시 1393 안내 모달 (자살예방법 §27조의8)
      if (r.body.turnResult && r.body.turnResult.safety_concern === 'high') {
        showSafetyModal();
      }
      if (r.body.isEnded && r.body.outcome) {
        state.finalOutcome = r.body.outcome;
        renderResult();
        hide($stageCombat);
        show($stageResult);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        renderCombat();
      }
    }).catch(function (err) {
      setLoading(false);
      showError('네트워크 오류: ' + err.message);
    });
  }

  // ────────────────────────────────────────────────────
  // Stage 4: 결말
  // ────────────────────────────────────────────────────
  function renderResult() {
    var c = state.combat;
    var outcome = state.finalOutcome;
    var titles = {
      victory: '잊혀진 자가 — 천천히 무너진다',
      defeat: '거리가 너를 — 받아내지 못했다',
      fled: '너는 거리를 떠났다',
      stalemate: '안개가 둘 사이에 머물렀다',
    };
    var texts = {
      victory: '잊혀진 자가 너에게 무언가를 떨어뜨린다 — 너만이 알아보는 것을. 잔향이 거리를 따라 길게 늘어선다.',
      defeat: '너는 그것을 기억한다. 잔향이 너를 한 박자 늦게 보낸다.',
      fled: '도망친 자리는 한 박자 더 길게 너를 따라온다. 너는 그것을 이제 안다.',
      stalemate: '5턴, 너희 둘은 같은 안개에 잠시 머물렀다. 다음 거리가 너를 기다린다.',
    };

    var logHtml = (c.log || []).map(function (line) {
      var isEcho = line.indexOf('  ↳') === 0;
      return '<div class="log-line' + (isEcho ? ' echo' : '') + '">' + escapeHtml(line) + '</div>';
    }).join('');

    $stageResult.innerHTML =
      '<div class="outcome-box outcome-' + outcome + '">' +
        '<div class="outcome-title">' + escapeHtml(titles[outcome]) + '</div>' +
        '<div class="outcome-text">' + escapeHtml(texts[outcome]) + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-label">잔향의 기록</div>' +
        '<div class="field">' +
          '<div class="field-label">누적 잔잔</div>' +
          '<div class="field-value" style="font-size:24px;color:var(--resonance);font-weight:600">' + c.resonance + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<div class="field-label">잊혀진 자 — ' + escapeHtml(c.enemy.name.replace('잊혀진 자 — ', '')) + '</div>' +
          '<div class="field-value">HP ' + c.enemy.hp + ' / ' + c.enemy.maxHp + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<div class="field-label">전투 로그</div>' +
          (c.log && c.log.length > 0
            ? '<div class="log" style="margin-top:6px;border-left-color:var(--fg-dim);max-height:none">' + logHtml + '</div>'
            : '<div class="field-value">(기록 없음)</div>') +
        '</div>' +
      '</div>' +
      '<div class="voice" style="margin-top:18px">' +
        '<div class="voice-label">목소리</div>' +
        '<div class="voice-text">…여기까지가, 첫 자리였어요.</div>' +
        '<div class="voice-secondary">잔향은 — 잠시, 머물렀어요.<br/>또 만나요.</div>' +
      '</div>' +
      '<button id="reset-from-result" type="button">처음으로 — 다른 닉네임</button>' +
      '<a class="ghost" style="display:block;text-align:center;margin-top:10px;color:var(--fg-muted);font-size:13px;text-decoration:none" href="https://simon-yhkim.github.io/Resonance/" target="_blank" rel="noopener">' +
        'Phase 0 풀 게임 (Mock LLM, 6 화면) →' +
      '</a>';

    document.getElementById('reset-from-result').addEventListener('click', resetAll);
  }

  // ────────────────────────────────────────────────────
  // Reset
  // ────────────────────────────────────────────────────
  // 상점 stage (Phase 2 BM)
  function openShop() {
    clearError();
    setLoading(true, '상점을 여는 중');
    Promise.all([
      fetch('/api/shop/items').then(function (r) { return r.json(); }),
      fetch('/api/shop/inventory', { headers: { 'X-Dev-User-Id': state.userId } }).then(function (r) { return r.json(); }),
    ]).then(function (results) {
      setLoading(false);
      var itemsRes = results[0];
      var invRes = results[1];
      var items = (itemsRes && itemsRes.items) ? itemsRes.items : [];
      var dust = (invRes && invRes.resonance_dust) || 0;
      var inv = (invRes && invRes.items) ? invRes.items : [];
      var currencyLabel = { resonance_dust: '잔향가루', krw: '₩', free: '무료' };
      var itemsHtml = items.map(function (it) {
        var priceStr = it.currency === 'free' ? '받기' : it.price.toLocaleString();
        var label = currencyLabel[it.currency] || it.currency;
        return '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;margin-bottom:10px">' +
          '<div style="font-weight:600;margin-bottom:4px">' + escapeHtml(it.display_name) + '</div>' +
          '<div style="color:var(--fg-muted);font-size:12px;margin-bottom:8px">' + escapeHtml(it.description) + '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="color:var(--fg-dim);font-size:12px">' + label + ' <span style="color:var(--fg-primary)">' + priceStr + '</span></span>' +
            '<button class="ghost" data-item-id="' + escapeHtml(it.item_id) + '" data-shop-buy="1" style="font-size:12px;padding:6px 12px">잔향에 새기기</button>' +
          '</div>' +
        '</div>';
      }).join('');
      var invHtml = inv.length === 0 ? '' :
        '<div style="margin-top:18px"><div class="card-label">나의 잔향 — 보유</div>' +
        inv.map(function (i) { return '<div style="display:flex;justify-content:space-between;padding:4px 0"><span>' + escapeHtml(i.display_name) + '</span><span style="color:var(--fg-muted)">×' + i.quantity + '</span></div>'; }).join('') +
        '</div>';
      $stageShop.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">' +
          '<span style="color:var(--fg-dim);font-size:10px;letter-spacing:3px;text-transform:uppercase">상점</span>' +
          '<span style="color:var(--fg-muted);font-size:12px">잔향가루 <span style="color:var(--fg-primary);font-size:16px">' + dust + '</span></span>' +
        '</div>' +
        '<div id="shop-flash"></div>' +
        itemsHtml + invHtml +
        '<button class="ghost" id="close-shop" type="button" style="margin-top:18px">← 거리로 돌아가기</button>';
      hide($stageCharacter); hide($stageCombat); hide($stageResult); show($stageShop);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // bind
      var btns = $stageShop.querySelectorAll('[data-shop-buy="1"]');
      Array.prototype.forEach.call(btns, function (b) {
        b.addEventListener('click', function () { purchaseItem(b.getAttribute('data-item-id')); });
      });
      document.getElementById('close-shop').addEventListener('click', function () {
        hide($stageShop);
        if (state.combat) show($stageCombat); else show($stageCharacter);
      });
    }).catch(function (err) {
      setLoading(false);
      showError('상점 호출 실패: ' + err.message);
    });
  }

  function purchaseItem(itemId) {
    api('/api/shop/purchase', { item_id: itemId }).then(function (r) {
      if (!r.res.ok || !r.body.success) {
        var msg = (r.body && r.body.error) || '구매 실패';
        var $f = document.getElementById('shop-flash');
        if ($f) $f.innerHTML = '<div style="color:#ffb1b1;font-size:13px;margin-bottom:10px">' + escapeHtml(msg) + '</div>';
        return;
      }
      var $f = document.getElementById('shop-flash');
      if ($f) $f.innerHTML = '<div style="color:var(--resonance);font-size:13px;margin-bottom:10px">' + escapeHtml(r.body.item.display_name) + ' — 잔향이 한 번 머물렀어요.</div>';
      // stamina 갱신 (포션 구매)
      fetch('/api/character/stamina', { headers: { 'X-Dev-User-Id': state.userId } })
        .then(function (rr) { return rr.json(); })
        .then(function (sr) { if (sr && sr.stamina) state.stamina = sr.stamina; });
      // refresh shop
      setTimeout(openShop, 300);
    }).catch(function (err) {
      showError('구매 호출 실패: ' + err.message);
    });
  }

  function resetAll() {
    state = {
      userId: 'web_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
      nickname: '',
      analysis: null,
      nicknameCode: null,
      combat: null,
      finalOutcome: null,
      stamina: null,
    };
    $nickname.value = '';
    $count.textContent = '0';
    $stageCharacter.innerHTML = '';
    $stageCombat.innerHTML = '';
    $stageResult.innerHTML = '';
    if ($stageShop) $stageShop.innerHTML = '';
    hide($stageCharacter); hide($stageCombat); hide($stageResult); if ($stageShop) hide($stageShop);
    show($stageNickname);
    clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
})();
</script>
</body>
</html>`;
