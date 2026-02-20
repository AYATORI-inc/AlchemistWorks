/**
 * 市場
 * GET /market?userId=xxx
 * POST /market/purchase body: { userId, itemId, quantity }
 * POST /market/sell body: { userId, instanceId }
 * フロント items.ts / MarketPanel の BASE_PRICES に合わせる
 */

// 基本素材・価格・フレーバー（フロント constants/items.ts と同期）
var BASIC_ITEMS = [
  { itemId: 'herb', name: '薬草', icon: '🌿', price: 500, flavor: '傷の手当に使える、どこにでもある草。' },
  { itemId: 'water', name: '水', icon: '💧', price: 300, flavor: '清らかな水。錬金の基本素材。' },
  { itemId: 'slime', name: 'スライム', icon: '🔵', price: 800, flavor: 'ぷるぷるしたゼリー状の塊。' },
  { itemId: 'fire_stone', name: '火の石', icon: '🔥', price: 1200, flavor: 'わずかに炎を宿した石。' },
  { itemId: 'magic_sand', name: '魔法の砂', icon: '✨', price: 1000, flavor: 'きらめく魔力を帯びた砂。' },
  { itemId: 'feather', name: '羽根', icon: '🪶', price: 700, flavor: '軽く、風を呼ぶ。' },
  { itemId: 'iron_ore', name: '鉄鉱石', icon: '🪨', price: 1500, flavor: '鍛錬すれば鉄になる鉱石。' },
  { itemId: 'dark_dust', name: '闇の粉', icon: '🌑', price: 1200, flavor: '闇を凝縮した粉。' },
  { itemId: 'elec_stone', name: '電気石', icon: '⚡', price: 1400, flavor: '触れるとびりりとする石。' }
];

// フォールバック用（API未設定時）※svgPathはviewBox 0 0 24 24用
var DAILY_FALLBACK = [
  { itemId: 'herb', name: '薬草', icon: '🌿', price: 400, flavor: '傷の手当に使える、どこにでもある草。', svgPath: 'M12 22v-4l-2-2-1-4 1-2 2-1 2 1 1 2-1 4-2 2v4z', svgFill: '#4caf50' },
  { itemId: 'potion', name: '回復薬', icon: '🍷', price: 1500, flavor: '傷を癒す赤い薬。', svgPath: 'M9 3h6v2H9zm-1 4h8v12c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V7z', svgFill: '#e91e63' },
  { itemId: 'jewel', name: '宝石', icon: '💎', price: 2500, flavor: '美しく、価値がある。', svgPath: 'M12 2l5 9 2 9h-14l2-9 5-9z', svgFill: '#7e57c2' }
];

function _getTodayStr() {
  var d = new Date();
  var jst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
  return jst.getUTCFullYear() + '-' +
    ('0' + (jst.getUTCMonth() + 1)).slice(-2) + '-' +
    ('0' + jst.getUTCDate()).slice(-2);
}

function _dailyMarketCacheKey(userId) {
  return 'market_daily_' + (userId || '') + '_' + _getTodayStr();
}

// JSON文字列からオブジェクトを抽出（AIが説明文を付けた場合に対応）
function _extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  var trimmed = text.trim();
  var jsonStart = trimmed.indexOf('{');
  if (jsonStart < 0) return null;
  var depth = 0;
  var end = -1;
  for (var i = jsonStart; i < trimmed.length; i++) {
    if (trimmed[i] === '{') depth++;
    if (trimmed[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) return null;
  try {
    return JSON.parse(trimmed.substring(jsonStart, end));
  } catch (e) {
    return null;
  }
}

// 1種類の日替わりアイテムを生成（API 1回）
function _generateSingleDailyItem(apiKey, userId, existingNames, index) {
  Logger.log('[日替わり] 品目' + (index + 1) + '/3: 生成開始 userId=' + (userId || '(なし)') + ' existingNames=' + JSON.stringify(existingNames));

  var userHint = userId ? 'このユーザ（ID: ' + (userId + '').slice(0, 12) + '）専用に、他と重ならない独自の品を。' : '';
  var avoidHint = existingNames.length > 0 ? '\n既に並んでいる品（避ける）: ' + existingNames.join('、') : '';
  var prompt =
    '錬金術シミュレータのゲームで、今日の「日替わりマーケット」に並べる素材・生成物を1種類だけ生成してください。（' + (index + 1) + '/3品目）' + (userHint ? '\n' + userHint : '') + avoidHint + '\n\n' +
    'ファンタジー錬金術の世界観で、薬草・水・炎・宝石・毒・聖水・鉄などが登場するアイテムにしてください。\n' +
    '価格は300G〜3500Gの範囲で、希少性に応じて設定。flavor（一言説明、20文字程度）を付けてください。\n' +
    'iconに絵文字1つを付けてください（SVGやpathは不要）。\n' +
    '必ず以下のJSON形式のみで返してください（他テキストなし）:\n' +
    '{"itemId":"snake_case英数字","name":"日本語名","icon":"絵文字1つ","price":1000,"flavor":"フレーバー説明"}';

  Logger.log('[日替わり] 品目' + (index + 1) + ': API呼び出し中...');
  try {
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: (typeof Config.getOpenAiModel === 'function' ? Config.getOpenAiModel() : 'gpt-4o'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var rawText = res.getContentText();
    Logger.log('[日替わり] 品目' + (index + 1) + ': HTTP ' + code + ' 応答受信 body長=' + (rawText ? rawText.length : 0));
    var body;
    try {
      body = JSON.parse(rawText);
    } catch (parseErr) {
      Logger.log('[日替わり] 品目' + (index + 1) + ': レスポンスのJSON解析に失敗');
      return null;
    }
    if (code !== 200) {
      var errMsg = body.error ? ((body.error.code || '') + ': ' + (body.error.message || '')) : rawText.slice(0, 150);
      Logger.log('[日替わり] 品目' + (index + 1) + ': HTTP ' + code + ' - ' + errMsg);
      return null;
    }
    if (!body.choices || !body.choices[0]) {
      Logger.log('[日替わり] 品目' + (index + 1) + ': choices が空');
      return null;
    }
    var text = body.choices[0].message.content;
    if (!text) return null;
    var parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = _extractJsonFromText(text);
    }
    if (!parsed) {
      Logger.log('[日替わり] 品目' + (index + 1) + ': AI応答のJSON解析に失敗 - ' + (text || '').slice(0, 100));
      return null;
    }
    var item = parsed.itemId ? parsed : (parsed.item || parsed.daily && parsed.daily[0]);
    if (!item || !item.name) {
      Logger.log('[日替わり] 品目' + (index + 1) + ': 必須フィールド不足 parsed=' + JSON.stringify(parsed));
      return null;
    }
    var result = {
      itemId: (item.itemId || 'daily_' + Math.random().toString(36).slice(2, 8)).replace(/[^a-zA-Z0-9_]/g, '_'),
      name: (item.name || '謎の品').slice(0, 20),
      icon: (item.icon || '✨').slice(0, 4),
      price: Math.min(5000, Math.max(200, typeof item.price === 'number' ? item.price : 1000)),
      flavor: (item.flavor || '').slice(0, 60)
    };
    Logger.log('[日替わり] 品目' + (index + 1) + ': 生成成功 itemId=' + result.itemId + ' name=' + result.name + ' price=' + result.price + 'G icon=' + result.icon);
    return result;
  } catch (err) {
    Logger.log('[日替わり] 品目' + (index + 1) + ': ' + (err.message || err.toString()));
    return null;
  }
}

// Step1: 3種類それぞれに1回ずつAPIを叩いて生成（SVGは含めない。iconはフォールバック用絵文字）
function _generateDailyItemsOnly(userId) {
  Logger.log('[日替わり] _generateDailyItemsOnly 開始 userId=' + (userId || '(なし)'));
  var apiKey = Config.getOpenAiApiKey();
  if (!apiKey) {
    Logger.log('[日替わり] OPENAI_API_KEY が未設定です。GAS プロジェクトの設定→スクリプトのプロパティを確認してください。');
    return null;
  }

  var out = [];
  var existingNames = [];
  for (var i = 0; i < 3; i++) {
    var item = _generateSingleDailyItem(apiKey, userId, existingNames, i);
    if (!item) {
      Logger.log('[日替わり] 品目' + (i + 1) + ': 1回目失敗、リトライします');
      item = _generateSingleDailyItem(apiKey, userId, existingNames, i); // 1回リトライ
    }
    if (!item) {
      Logger.log('[日替わり] 品目' + (i + 1) + ': リトライも失敗、日替わり生成を中断');
      return null;
    }
    out.push(item);
    existingNames.push(item.name);
  }
  Logger.log('[日替わり] 3品目すべて生成完了: ' + out.map(function(it) { return it.name; }).join(', '));
  return out;
}

// Step2: アイテム配列に対して詳細なSVGアイコンを生成（必須）
function _generateDailyItemsWithAI(userId) {
  Logger.log('[日替わり] _generateDailyItemsWithAI 開始 userId=' + (userId || '(なし)'));
  var items = _generateDailyItemsOnly(userId);
  if (!items || items.length === 0) {
    Logger.log('[日替わり] アイテム生成失敗または空');
    return null;
  }
  Logger.log('[日替わり] SVGアイコン生成開始...');
  var withSvg = SvgIcon_generateForItems(items);
  Logger.log('[日替わり] SVGアイコン生成完了、日替わりマーケット準備OK');
  return withSvg;
}

function _getDailyItems(userId) {
  var cache = CacheService.getScriptCache();
  var key = _dailyMarketCacheKey(userId);
  var cached = cache.get(key);
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      Logger.log('[日替わり] キャッシュヒット key=' + key + ' 品目数=' + (parsed ? parsed.length : 0));
      return parsed;
    } catch (err) { /* fall through */ }
  }
  Logger.log('[日替わり] キャッシュミス、新規生成 key=' + key);
  var daily = _generateDailyItemsWithAI(userId);
  if (!daily) return null;
  cache.put(key, JSON.stringify(daily), 86400);
  Logger.log('[日替わり] キャッシュ保存完了 TTL=86400秒');
  return daily;
}

function handleMarket(e, method, path) {
  var parts = path.split('/');
  var subAction = parts[1];
  
  if (method === 'GET') {
    var userId = Utils.getParam(e, 'userId');
    if (!userId) return { error: 'userId is required' };
    
    var daily = [];
    var dailySource = 'ai';
    var dailyError = '';
    try {
      var result = _getDailyItems(userId);
      if (result) {
        daily = result;
      } else {
        daily = DAILY_FALLBACK;
        dailySource = 'fallback';
        dailyError = 'ai_failed';
      }
    } catch (err) {
      daily = DAILY_FALLBACK;
      dailySource = 'fallback';
      dailyError = 'exception';
      Logger.log('[日替わり] 例外: ' + (err.message || err.toString()));
    }
    var out = { basic: BASIC_ITEMS, daily: daily, dailySource: dailySource };
    if (dailyError) out.dailyError = dailyError;
    return out;
  }
  
  if (method === 'POST') {
    var body = Utils.parseBody(e);
    if (subAction === 'purchase') {
      // TODO: Drive 連携で購入処理（G減算・インベントリ追加）
      return { ok: true, g: 0 };  // g は保存データ更新後の残高（要Drive）
    }
    if (subAction === 'sell') {
      // TODO: Drive 連携で売却処理（インベントリ削除・G加算）
      return { ok: true, g: 0, value: 0 };  // value=売却価格（要Drive）
    }
  }
  
  return { error: 'Unknown market action' };
}

/**
 * 日替わりアイテム生成のテスト用（実行ログ確認用）
 * GASエディタのドロップダウンから選択して「実行」すると詳細ログが出力されます
 */
function testDailyItemGeneration() {
  Logger.log('=== testDailyItemGeneration 開始 ===');
  var testUserId = 'test-debug-' + new Date().getTime(); // キャッシュ回避
  var result = _getDailyItems(testUserId);
  Logger.log('=== 結果: ' + (result ? result.length + '品目' : 'null') + ' ===');
  if (result) {
    result.forEach(function(it, i) {
      Logger.log('  品目' + (i + 1) + ': ' + it.name + ' (' + it.itemId + ') ' + it.price + 'G');
    });
  }
}
