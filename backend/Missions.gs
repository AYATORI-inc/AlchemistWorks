/**
 * ミッション
 * GET /missions?userId=xxx
 *   今日のミッションを返す。1日1回、ログイン時（初回取得時）にAIでランダム生成。
 * POST /missions/complete body: { userId, missionId, instanceId }
 */

// 今日の日付文字列（JST）
function _getTodayStr() {
  var d = new Date();
  var jst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
  var y = jst.getUTCFullYear();
  var m = ('0' + (jst.getUTCMonth() + 1)).slice(-2);
  var day = ('0' + jst.getUTCDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

// キャッシュキー（ユーザー×日付で1日1回生成）
function _missionsCacheKey(userId) {
  return 'missions_' + userId + '_' + _getTodayStr();
}

// OpenAI API でミッション3つをランダム生成
function _generateMissionsWithAI(userId) {
  var apiKey = Config.getOpenAiApiKey();
  if (!apiKey) {
    Logger.log('[ミッション] OPENAI_API_KEY が未設定です。GAS プロジェクトの設定→スクリプトのプロパティを確認してください。');
    return null;
  }

  var prompt = '錬金術シミュレータのゲーム用に、今日のミッションを3つ生成してください。' +
    '依頼はすべて「〇〇を1個納品してほしい」のように、1個納品形式で統一してください。' +
    '種類は以下をバラけて：納品依頼型（例：傷を癒す薬を1個納品してほしい）、発見型（新しい〇〇系アイテムを発見する）。' +
    'ファンタジー錬金術の世界観で、薬、炎、宝石、毒、聖水、剣などが登場する依頼にしてください。' +
    'rewardG は 2000〜6000 の範囲で難易度に応じて設定。' +
    '必ず以下のJSON形式で返してください（他テキストなし）：\n' +
    '{"missions":[{"id":"m1","title":"タイトル","description":"依頼の詳細（1個納品で統一）","rewardG":3000},{"id":"m2",...},{"id":"m3",...}]}';

  try {
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: (typeof Config.getOpenAiModel === 'function' ? Config.getOpenAiModel() : 'gpt-4o'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var rawText = res.getContentText();
    var body;
    try {
      body = JSON.parse(rawText);
    } catch (parseErr) {
      Logger.log('[ミッション] レスポンスのJSON解析に失敗');
      return null;
    }
    if (code !== 200) {
      var errMsg = body.error ? ((body.error.code || '') + ': ' + (body.error.message || '')) : rawText.slice(0, 150);
      Logger.log('[ミッション] HTTP ' + code + ' - ' + errMsg);
      return null;
    }
    if (!body.choices || !body.choices[0]) {
      Logger.log('[ミッション] choices が空');
      return null;
    }
    var text = body.choices[0].message.content;
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      Logger.log('[ミッション] AI応答のJSON解析に失敗 - ' + (text || '').slice(0, 100));
      return null;
    }
    var list = parsed.missions || parsed;
    if (!Array.isArray(list) || list.length < 3) {
      Logger.log('[ミッション] AI応答の形式が不正（missions 配列が不足）');
      return null;
    }
    return list.slice(0, 3).map(function(m, i) {
      return {
        id: m.id || ('m' + (i + 1)),
        title: m.title || '依頼',
        description: m.description || '',
        rewardG: typeof m.rewardG === 'number' ? Math.min(6000, Math.max(1000, m.rewardG)) : 3000,
        completed: false
      };
    });
  } catch (err) {
    Logger.log('[ミッション] 例外: ' + (err.message || err.toString()));
    return null;
  }
}

// APIキー未設定時のフォールバック（日付シードで毎日異なる組み合わせ）
function _generateMissionsFallback() {
  var templates = [
    { title: '癒しの薬', description: '傷を癒す薬を1個納品してほしい', rewardG: 3000 },
    { title: '町の祭り用', description: '祭り用の特別な炎を1個納品してほしい', rewardG: 5000 },
    { title: '新発見', description: '新しい回復系のアイテムを発見する', rewardG: 2500 },
    { title: '毒消し', description: '毒を中和する薬を1個納品してほしい', rewardG: 2800 },
    { title: '光の結晶', description: '闇を照らす光の結晶を1個納品してほしい', rewardG: 4500 },
    { title: '鉄の刃', description: '鉄のインゴットを1個納品してほしい', rewardG: 3500 },
    { title: '聖なる水', description: '聖水を1個納品してほしい', rewardG: 4000 },
    { title: '雷の欠片', description: '電気石を使った雷のアイテムを発見する', rewardG: 3200 },
    { title: '翼の材料', description: '翼を1個納品してほしい', rewardG: 5500 },
  ];
  var seed = _getTodayStr().split('-').reduce(function(a, b) { return a + parseInt(b, 10); }, 0);
  var used = {};
  var out = [];
  for (var i = 0; i < 3; i++) {
    var idx = (seed + i * 7) % templates.length;
    while (used[idx]) idx = (idx + 1) % templates.length;
    used[idx] = true;
    var t = templates[idx];
    out.push({ id: 'm' + (i + 1), title: t.title, description: t.description, rewardG: t.rewardG, completed: false });
  }
  return out;
}

function handleMissionsGet(e) {
  var userId = Utils.getParam(e, 'userId');
  if (!userId) return { error: 'userId is required' };

  var cache = CacheService.getScriptCache();
  var key = _missionsCacheKey(userId);
  var cached = cache.get(key);
  if (cached) {
    try {
      return { missions: JSON.parse(cached), missionsSource: 'ai' };
    } catch (err) { /* fall through */ }
  }

  var missions = _generateMissionsWithAI(userId);
  var missionsSource = 'ai';
  if (!missions) {
    missions = _generateMissionsFallback();
    missionsSource = 'fallback';
  }

  cache.put(key, JSON.stringify(missions), 86400); // 24時間
  var out = { missions: missions, missionsSource: missionsSource };
  if (missionsSource === 'fallback') out.missionsError = 'ai_failed';
  return out;
}

function handleMissionsComplete(e) {
  var body = Utils.parseBody(e);
  var userId = body.userId;
  var missionId = body.missionId;
  var instanceId = body.instanceId;
  var itemId = body.itemId || '';
  var itemName = (body.itemName || '').trim();
  var missionDescription = (body.missionDescription || '').trim();
  var missionTitle = (body.missionTitle || '').trim();
  var baseRewardG = typeof body.baseRewardG === 'number' ? body.baseRewardG : 3000;

  if (!userId || !missionId) return { error: 'userId and missionId are required' };

  var multiplier = 1.0;
  var apiKey = Config.getOpenAiApiKey();
  if (apiKey && itemName && missionDescription) {
    var judge = _judgeMissionCompletionWithAI(apiKey, missionDescription, itemName);
    if (judge && typeof judge.multiplier === 'number') {
      multiplier = Math.max(0.5, Math.min(1.5, judge.multiplier));
    }
  }

  var rewardG = Math.round(baseRewardG * multiplier);

  // 依頼主の反応・お礼をAIで生成
  var feedback = '';
  if (apiKey && missionDescription && itemName) {
    feedback = _generateMissionFeedbackWithAI(apiKey, missionTitle, missionDescription, itemName) || '';
  }
  if (!feedback) {
    feedback = '納品ありがとうございます。助かります！';
  }

  return { ok: true, rewardG: rewardG, feedback: feedback };
}

// 依頼主の反応・お礼をAIで生成
function _generateMissionFeedbackWithAI(apiKey, missionTitle, missionDescription, itemName) {
  var prompt = '錬金術シミュレータのゲームで、依頼に納品された後の依頼主の反応・お礼を一言で生成してください。\n' +
    '依頼タイトル: ' + missionTitle + '\n' +
    '依頼内容: ' + missionDescription + '\n' +
    '納品されたアイテム: ' + itemName + '\n\n' +
    '依頼主が喜んでいる様子、感謝の言葉、簡単な一言フィードバックを20〜40文字程度で。\n' +
    '例：「完璧です！これで傷ついた仲間を救えます。ありがとう！」\n' +
    '例：「ふむ、期待通りの出来だ。感謝する。」\n' +
    '例：「わぁ、思ったより素敵！祭りが盛り上がるわ！」\n' +
    'JSON形式で feedback キーのみ返してください: {"feedback":"依頼主の一言"}';

  try {
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: (typeof Config.getOpenAiModel === 'function' ? Config.getOpenAiModel() : 'gpt-4o-mini'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var body = JSON.parse(res.getContentText());
    if (code !== 200 || !body.choices || !body.choices[0]) return null;
    var text = body.choices[0].message.content;
    var parsed = JSON.parse(text);
    return (parsed.feedback || '').toString().slice(0, 80);
  } catch (err) {
    return null;
  }
}

// 依頼文と納品アイテムからAIで達成度（報酬倍率）を判定
function _judgeMissionCompletionWithAI(apiKey, missionDescription, itemName) {
  var prompt = '錬金術シミュレータのゲームで、依頼に対する納品の達成度を判定してください。\n' +
    '依頼: ' + missionDescription + '\n' +
    '納品されたアイテム: ' + itemName + '\n\n' +
    '達成度に応じて報酬倍率を0.5〜1.5で設定してください。ぴったり一致なら1.2〜1.5、関連するが少しずれていれば0.8〜1.0、無関係なら0.5〜0.7。\n' +
    '必ず以下のJSON形式のみで返してください（他テキストなし）:\n' +
    '{"score":85,"multiplier":1.2}';

  try {
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: (typeof Config.getOpenAiModel === 'function' ? Config.getOpenAiModel() : 'gpt-4o-mini'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var body = JSON.parse(res.getContentText());
    if (code !== 200 || !body.choices || !body.choices[0]) return null;
    var text = body.choices[0].message.content;
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function handleMissions(e, method, path) {
  var parts = path.split('/');
  var subAction = parts[1];
  
  if (method === 'GET') return handleMissionsGet(e);
  if (method === 'POST' && subAction === 'complete') return handleMissionsComplete(e);
  
  return { error: 'Unknown missions action' };
}
