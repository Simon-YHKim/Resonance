/**
 * 잔향 모바일 친화 HTML UI — wrangler dev tunnel 검증용.
 *
 * GET / → 이 HTML 직접 응답. 같은 Worker의 POST /api/character/analyze 호출.
 * Phase 2+ 에서 apps/mobile (Expo Router) 로 이전.
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
  body { padding: 28px 20px 40px; max-width: 480px; margin: 0 auto; }

  /* 잔향 헤더 */
  header { text-align: center; padding-top: 24px; margin-bottom: 32px; }
  .han { color: var(--fg-dim); font-size: 12px; letter-spacing: 0.5em; text-transform: uppercase; margin-bottom: 12px; }
  h1 { color: var(--resonance); font-size: 56px; margin: 0 0 4px; font-weight: 600; letter-spacing: -0.02em; }
  .subtitle { color: var(--fg-muted); font-style: italic; font-size: 14px; margin: 0; }

  /* the Voice 발화 */
  .voice {
    border-left: 2px solid var(--resonance);
    padding: 8px 0 8px 14px; margin: 32px 0 16px;
  }
  .voice-label {
    color: var(--fg-dim); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 6px;
  }
  .voice-text { color: var(--fg-primary); font-size: 16px; }
  .voice-secondary { color: var(--fg-muted); font-size: 14px; font-style: italic; margin-top: 12px; }

  /* 입력 + 버튼 */
  .form { margin-top: 24px; }
  .input-wrap { position: relative; }
  input[type="text"] {
    width: 100%;
    background: rgba(27, 26, 35, 0.5);
    border: 1px solid var(--bg-elevated);
    border-radius: 8px;
    padding: 14px 16px;
    color: var(--fg-primary);
    font-size: 17px;
    font-family: inherit;
    outline: none;
    -webkit-appearance: none;
  }
  input[type="text"]:focus { border-color: var(--resonance); }
  input[type="text"]::placeholder { color: var(--fg-dim); }
  .counter {
    text-align: right; color: var(--fg-dim); font-size: 11px; margin-top: 6px; letter-spacing: 0.05em;
  }

  button {
    width: 100%;
    margin-top: 16px;
    background: var(--resonance);
    color: var(--bg-primary);
    border: none;
    border-radius: 8px;
    padding: 14px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.05em;
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
    margin-top: 8px;
  }

  /* 분석 결과 */
  .result { margin-top: 28px; opacity: 0; transition: opacity 400ms; }
  .result.show { opacity: 1; }
  .result-card {
    border: 1px solid rgba(184, 157, 208, 0.4);
    border-radius: 10px;
    padding: 18px;
    background: rgba(27, 26, 35, 0.4);
  }
  .result-label {
    color: var(--fg-dim); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 12px;
  }
  .voice-address {
    color: var(--resonance); font-size: 18px; font-weight: 600; margin: 0 0 6px;
  }
  .meta {
    color: var(--fg-muted); font-size: 13px; font-style: italic; margin: 0 0 16px;
  }
  .field {
    border-top: 1px solid var(--bg-elevated);
    padding-top: 12px; margin-top: 12px;
  }
  .field-label {
    color: var(--fg-dim); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
    margin-bottom: 4px;
  }
  .field-value { color: var(--fg-primary); font-size: 14px; line-height: 1.6; }
  .keywords { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .keyword {
    background: var(--bg-elevated); color: var(--fg-muted);
    padding: 4px 10px; border-radius: 999px; font-size: 12px;
  }
  .boss-list { margin: 0; padding: 0; list-style: none; }
  .boss-list li { padding: 6px 0; color: var(--fg-muted); font-size: 13px; }
  .boss-num { color: var(--resonance); font-weight: 600; margin-right: 6px; }

  .meta-cost {
    margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--bg-elevated);
    color: var(--fg-dim); font-size: 11px; text-align: center; letter-spacing: 0.05em;
  }

  /* 에러 */
  .error {
    border-left: 2px solid var(--danger);
    padding: 8px 14px;
    margin-top: 16px;
    color: var(--danger);
    font-size: 14px;
  }

  /* 로딩 */
  .loading { color: var(--fg-muted); text-align: center; margin-top: 16px; font-style: italic; font-size: 14px; }
  .dot {
    display: inline-block; animation: pulse 1.4s ease-in-out infinite;
    color: var(--resonance);
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

  footer {
    margin-top: 40px; text-align: center;
    color: var(--fg-dim); font-size: 11px; letter-spacing: 0.1em;
  }
  .footer-quote { color: var(--fg-muted); font-style: italic; margin-bottom: 8px; }
</style>
</head>
<body>
  <header>
    <div class="han">殘響</div>
    <h1>잔향</h1>
    <p class="subtitle">Echoes of a Forgotten Self</p>
  </header>

  <div class="voice">
    <div class="voice-label">목소리</div>
    <div class="voice-text">…기억나요?</div>
    <div class="voice-secondary">잔향이 — 너를 기다린다.<br/>이름을 한 줄, 입력해줘.</div>
  </div>

  <div class="form">
    <div class="input-wrap">
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
    </div>
    <div class="counter"><span id="count">0</span> / 20</div>
    <button id="submit" type="button">잔향에 들어간다</button>
  </div>

  <div id="error" class="error" style="display:none"></div>
  <div id="loading" class="loading" style="display:none">
    <span class="dot">·</span><span class="dot">·</span><span class="dot">·</span>
    잔향이 너의 이름을 듣고 있어요
  </div>
  <div id="result" class="result"></div>

  <footer>
    <div class="footer-quote">"잔향이 — 잠시, 머물렀어요."</div>
    <div>잔향(Resonance) · Phase 1 · Gemini Flash-Lite</div>
  </footer>

<script>
(function () {
  var nickname = document.getElementById('nickname');
  var count = document.getElementById('count');
  var submit = document.getElementById('submit');
  var error = document.getElementById('error');
  var loading = document.getElementById('loading');
  var result = document.getElementById('result');

  nickname.addEventListener('input', function () {
    count.textContent = nickname.value.length;
  });

  function showError(msg) {
    error.textContent = msg;
    error.style.display = '';
    loading.style.display = 'none';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function renderResult(body) {
    var a = body.user_wiki.nickname_analysis;
    var meta = body.meta || {};

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

    var costStr = meta.cost_usd != null
      ? meta.model + ' · in ' + meta.input_tokens + ' / out ' + meta.output_tokens + ' tokens · ≈ $' + meta.cost_usd.toFixed(6)
      : '';

    result.innerHTML =
      '<div class="result-card">' +
        '<div class="result-label">잔향이 본 너</div>' +
        '<div class="voice-address">' + escapeHtml(a.the_Voice_호칭 || '') + '</div>' +
        '<div class="meta">' + escapeHtml(a.추정직업 || '') + ' · ' +
          escapeHtml(a.추정연령 || '') + ' · ' +
          escapeHtml(a.정서적결 || '') + ' · 카테고리 ' +
          escapeHtml(a.category || '') +
        '</div>' +
        '<div class="field">' +
          '<div class="field-label">주요 키워드</div>' +
          '<div class="keywords">' + keywordsHtml + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<div class="field-label">5체 보스의 자리</div>' +
          '<ul class="boss-list">' + bossHtml + '</ul>' +
        '</div>' +
        '<div class="field">' +
          '<div class="field-label">차분한 가게 주인</div>' +
          '<div class="field-value" style="font-style:italic">"' +
          escapeHtml((a.거점NPC말투 && a.거점NPC말투.차분한가게주인) || '') +
          '"</div>' +
        '</div>' +
        '<div class="meta-cost">' + escapeHtml(costStr) + '</div>' +
      '</div>';
    result.classList.add('show');
    loading.style.display = 'none';
  }

  submit.addEventListener('click', function () {
    var n = nickname.value.trim();
    if (n.length < 1 || n.length > 20) {
      showError('닉네임은 1~20자여야 합니다.');
      return;
    }
    error.style.display = 'none';
    result.classList.remove('show');
    result.innerHTML = '';
    loading.style.display = '';
    submit.disabled = true;

    fetch('/api/character/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Dev-User-Id': 'web_visitor_' + Date.now(),
      },
      body: JSON.stringify({ nickname: n }),
    })
      .then(function (res) {
        return res.json().then(function (body) { return { res: res, body: body }; });
      })
      .then(function (r) {
        submit.disabled = false;
        if (!r.res.ok || !r.body.success) {
          var msg = r.body && r.body.error ? r.body.error : '서버 오류 (' + r.res.status + ')';
          if (r.body && r.body.code === 'RATE_LIMITED' && r.body.retry_after_ms) {
            msg += ' (' + Math.round(r.body.retry_after_ms / 60000) + '분 후 다시)';
          }
          showError(msg);
          return;
        }
        renderResult(r.body);
      })
      .catch(function (err) {
        submit.disabled = false;
        showError('네트워크 오류: ' + err.message);
      });
  });

  nickname.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submit.click();
  });
})();
</script>
</body>
</html>`;
