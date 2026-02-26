/**
 * 錬金
 * POST /alchemy
 * body: { userId, ingredients, pace, knownRecipes }
 * レシピブックに同一の製法（素材+ペース）があればその結果を返す。なければ OpenAI で生成。
 */

// 既知IDのフォールバック（フロントから name が渡されない場合用）
var _INGREDIENT_NAMES = {
  herb: '薬草', water: '水', slime: 'なぞの肉', fire_stone: '火の石',
  magic_sand: '魔法の砂', feather: '羽根', iron_ore: '粗末な武具',
  dark_dust: '闇の粉', elec_stone: '電気石',
  potion: '回復薬', poison: '毒薬', bomb: '爆弾', steam: '蒸気',
  glass: 'ガラス', jewel: '宝石', holy_water: '聖水', wing: '翼',
  ingot: '鉄インゴット', thunder: '雷', dark_matter: '暗黒物質',
  high_potion: '上薬草', big_bomb: '大爆発', elixir: 'エリクサー',
  hourglass: '砂時計', sword: '剣', angel: '天使', demon: '悪魔',
  robot: 'ロボット', light_bulb: '電球',
  philosopher_stone: '賢者の石', hero: '勇者', maou: '魔王'
};

var _PACE_NAMES = { fast: '素早く', normal: '普通', slow: 'ゆっくり' };
var _ITEM_CATEGORIES = ['food', 'weapon', 'medicine', 'gem'];
var _INGREDIENT_CATEGORIES = {
  herb: 'medicine', water: 'food', slime: 'food', fire_stone: 'gem',
  magic_sand: 'medicine', feather: 'weapon', iron_ore: 'weapon',
  dark_dust: 'gem', elec_stone: 'weapon',
  potion: 'medicine', poison: 'medicine', bomb: 'weapon', steam: 'medicine',
  glass: 'gem', jewel: 'gem', holy_water: 'medicine', wing: 'gem',
  ingot: 'weapon', thunder: 'weapon', dark_matter: 'medicine',
  high_potion: 'medicine', big_bomb: 'weapon', elixir: 'medicine',
  hourglass: 'gem', sword: 'weapon', angel: 'gem', demon: 'weapon',
  robot: 'weapon', light_bulb: 'gem', philosopher_stone: 'gem',
  hero: 'weapon', maou: 'weapon'
};
var _CATEGORY_KEYWORDS = {
  food: ['food', 'meal', 'bread', 'cook', 'drink', 'soup', 'fruit', '食', '料理', '飲', 'パン', '菓子', 'ごはん', 'スープ', '果実'],
  weapon: ['weapon', 'blade', 'sword', 'spear', 'bow', 'shield', 'bomb', 'thunder', '剣', '槍', '弓', '盾', '武器', '装備', '爆', '雷', '刃'],
  medicine: ['medicine', 'potion', 'elixir', 'heal', 'cure', 'toxin', 'poison', '薬', '回復', '治療', '毒', '秘薬', '聖水'],
  gem: ['gem', 'jewel', 'crystal', 'stone', 'glass', 'ore', '宝', '石', '結晶', '鉱', '宝石', 'ガラス']
};

function _normalizeCategory(raw, fallback) {
  var category = (raw || '').toString();
  return _ITEM_CATEGORIES.indexOf(category) >= 0 ? category : fallback;
}

function _inferCategoryFromText(text) {
  var t = (text || '').toString().toLowerCase();
  for (var i = 0; i < _ITEM_CATEGORIES.length; i++) {
    var category = _ITEM_CATEGORIES[i];
    var words = _CATEGORY_KEYWORDS[category] || [];
    for (var j = 0; j < words.length; j++) {
      if (t.indexOf(words[j].toLowerCase()) >= 0) return category;
    }
  }
  return null;
}

function _inferCategoryFromIngredient(ingredient) {
  var id = (ingredient && ingredient.id ? ingredient.id : '').toString();
  if (_INGREDIENT_CATEGORIES[id]) return _INGREDIENT_CATEGORIES[id];
  var byName = _inferCategoryFromText(ingredient && ingredient.name ? ingredient.name : '');
  if (byName) return byName;
  var byId = _inferCategoryFromText(id.replace(/[_-]/g, ' '));
  if (byId) return byId;
  return 'medicine';
}

function _inferCategoryFromIngredients(ia, ib) {
  var score = { food: 0, weapon: 0, medicine: 0, gem: 0 };
  var categories = [
    _inferCategoryFromIngredient(ia),
    _inferCategoryFromIngredient(ib)
  ];
  for (var i = 0; i < categories.length; i++) {
    score[categories[i]] += 1;
  }
  var best = 'medicine';
  var bestScore = -1;
  for (var key in score) {
    if (score[key] > bestScore) {
      best = key;
      bestScore = score[key];
    }
  }
  return best;
}

function _resolveIngredient(item) {
  if (item && typeof item === 'object' && item.name) {
    return { id: String(item.id || ''), name: String(item.name).slice(0, 30) };
  }
  var id = (item || '').toString();
  return { id: id, name: _INGREDIENT_NAMES[id] || id };
}

function handleAlchemy(e) {
  var body = Utils.parseBody(e);
  var userId = body.userId;
  var ingredients = body.ingredients || [];
  var pace = body.pace || 'normal';
  var knownRecipes = body.knownRecipes || [];

  if (!userId || !Array.isArray(ingredients) || ingredients.length !== 2) {
    return { error: 'userId and ingredients[2] are required' };
  }

  var ia = _resolveIngredient(ingredients[0]);
  var ib = _resolveIngredient(ingredients[1]);
  var idA = (ia.id || '').toString();
  var idB = (ib.id || '').toString();
  var sorted = [idA, idB].sort();
  var ingKey = sorted[0] + '_' + sorted[1];

  // レシピブックに同一製法（素材+ペース）があればその結果を返す
  if (Array.isArray(knownRecipes) && knownRecipes.length > 0) {
    var matched = null;
    for (var i = 0; i < knownRecipes.length; i++) {
      var r = knownRecipes[i];
      if (!r || !r.ingredients || r.ingredients.length !== 2) continue;
      var rSorted = [String(r.ingredients[0] || ''), String(r.ingredients[1] || '')].sort();
      var rKey = rSorted[0] + '_' + rSorted[1];
      if (rKey !== ingKey) continue;
      var rPace = (r.pace || 'normal').toString();
      if (rPace !== pace) continue;
      matched = r;
      break;
    }
    if (matched) {
      var resultId = (matched.result || '').toString().replace(/[^a-zA-Z0-9_]/g, '_');
      var fallbackCategory = _inferCategoryFromIngredients(ia, ib);
      var resultItem = {
        id: resultId,
        name: (matched.resultName || resultId).slice(0, 20),
        icon: (matched.resultIcon || '✨').slice(0, 4),
        quality: ['crude', 'normal', 'fine', 'legendary'].indexOf(matched.resultQuality || '') >= 0 ? matched.resultQuality : 'normal',
        description: (matched.resultFlavor || '').slice(0, 100),
        value: Math.min(15000, Math.max(100, typeof matched.resultValue === 'number' ? matched.resultValue : 1000)),
        tier: Math.min(3, Math.max(0, typeof matched.resultTier === 'number' ? matched.resultTier : 1)),
        category: _normalizeCategory(matched.resultCategory, fallbackCategory),
        isNewRecipe: false
      };
      return {
        success: true,
        result: resultItem,
        byproduct: null
      };
    }
  }

  var apiKey = Config.getOpenAiApiKey();
  if (!apiKey) {
    return { error: 'OPENAI_API_KEY が設定されていません。スクリプトプロパティを確認してください。' };
  }

  var nameA = ia.name || ia.id;
  var nameB = ib.name || ib.id;
  var paceLabel = _PACE_NAMES[pace] || pace;

  var prompt =
    '錬金術シミュレータのゲームで、2つの素材を調合した結果を1つ生成してください。\n' +
    '素材1: ' + nameA + ' (id: ' + ia.id + ')\n' +
    '素材2: ' + nameB + ' (id: ' + ib.id + ')\n' +
    '錬金スピード: ' + paceLabel + ' (' + pace + ')\n' +
    '※スピードが「ゆっくり」ほど高品質・高ティアの結果にし、「素早く」ほど簡単な結果にしてください。\n' +
    'ファンタジー錬金術の世界観で、素材の組み合わせから自然な結果を考えてください。\n' +
    '結果アイテムにはiconに絵文字1つを付けてください（SVGやpathは不要。後で別途アイコン生成します）。\n' +
    'category は food|weapon|medicine|gem のいずれか1つを必ず返してください。\n' +
    '必ず以下のJSON形式のみで返してください（他テキストなし）:\n' +
    '{"result":{"id":"スネーク_caseの英数字ID","name":"日本語名","icon":"絵文字1つ","quality":"crude|normal|fine|legendary","description":"一言説明","value":500,"tier":1,"category":"food|weapon|medicine|gem","isNewRecipe":true},"byproduct":null}\n' +
    'valueは売却価格(G)、100〜15000。tierは0=素材,1=初級,2=中級,3=高級。';

  try {
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: Config.getOpenAiModel(),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var resBody = JSON.parse(res.getContentText());

    if (code !== 200 || !resBody.choices || !resBody.choices[0]) {
      return { error: 'AI生成に失敗しました: ' + (resBody.error && resBody.error.message ? resBody.error.message : 'Unknown') };
    }

    var text = resBody.choices[0].message.content;
    var parsed = JSON.parse(text);
    var r = parsed.result;
    if (!r) return { error: 'AIの応答形式が不正です' };

    var itemId = (r.id || 'ai_' + Date.now()).replace(/[^a-zA-Z0-9_]/g, '_');
    var fallbackCategory = _inferCategoryFromIngredients(ia, ib);
    var resultItem = {
      id: itemId,
      name: (r.name || '謎の調合物').slice(0, 20),
      icon: (r.icon || '✨').slice(0, 4),
      quality: ['crude', 'normal', 'fine', 'legendary'].indexOf(r.quality) >= 0 ? r.quality : 'normal',
      description: (r.description || '').slice(0, 100),
      value: Math.min(15000, Math.max(100, typeof r.value === 'number' ? r.value : 1000)),
      tier: Math.min(3, Math.max(0, typeof r.tier === 'number' ? r.tier : 1)),
      category: _normalizeCategory(r.category, fallbackCategory),
      isNewRecipe: !!r.isNewRecipe
    };

    // Step2: アイテム確定後、詳細なSVGアイコンを別途生成
    var svgResult = SvgIcon_generateForItem({
      itemId: itemId,
      name: resultItem.name,
      description: resultItem.description
    });
    if (svgResult && svgResult.path) {
      resultItem.svgPath = svgResult.path;
      resultItem.svgFill = svgResult.fill || '#666';
    }

    return {
      success: true,
      result: resultItem,
      byproduct: parsed.byproduct || null
    };
  } catch (err) {
    return { error: '錬金に失敗しました: ' + (err.message || String(err)) };
  }
}
