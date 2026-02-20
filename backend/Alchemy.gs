/**
 * 錬金
 * POST /alchemy
 * body: { userId, ingredients, pace, knownRecipes }
 * レシピブックに同一の製法（素材+ペース）があればその結果を返す。なければ OpenAI で生成。
 */

// 既知IDのフォールバック（フロントから name が渡されない場合用）
var _INGREDIENT_NAMES = {
  herb: '薬草', water: '水', slime: 'スライム', fire_stone: '火の石',
  magic_sand: '魔法の砂', feather: '羽根', iron_ore: '鉄鉱石',
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
      var resultItem = {
        id: resultId,
        name: (matched.resultName || resultId).slice(0, 20),
        icon: (matched.resultIcon || '✨').slice(0, 4),
        quality: ['crude', 'normal', 'fine', 'legendary'].indexOf(matched.resultQuality || '') >= 0 ? matched.resultQuality : 'normal',
        description: (matched.resultFlavor || '').slice(0, 100),
        value: Math.min(15000, Math.max(100, typeof matched.resultValue === 'number' ? matched.resultValue : 1000)),
        tier: Math.min(3, Math.max(0, typeof matched.resultTier === 'number' ? matched.resultTier : 1)),
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
    '必ず以下のJSON形式のみで返してください（他テキストなし）:\n' +
    '{"result":{"id":"スネーク_caseの英数字ID","name":"日本語名","icon":"絵文字1つ","quality":"crude|normal|fine|legendary","description":"一言説明","value":500,"tier":1,"isNewRecipe":true},"byproduct":null}\n' +
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
    var resultItem = {
      id: itemId,
      name: (r.name || '謎の調合物').slice(0, 20),
      icon: (r.icon || '✨').slice(0, 4),
      quality: ['crude', 'normal', 'fine', 'legendary'].indexOf(r.quality) >= 0 ? r.quality : 'normal',
      description: (r.description || '').slice(0, 100),
      value: Math.min(15000, Math.max(100, typeof r.value === 'number' ? r.value : 1000)),
      tier: Math.min(3, Math.max(0, typeof r.tier === 'number' ? r.tier : 1)),
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
