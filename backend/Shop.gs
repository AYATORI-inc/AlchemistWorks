/**
 * 接客コメント生成
 * POST /shop/comment
 * body: {
 *   userId?: string,
 *   workshopName?: string,
 *   customerName: string,
 *   categoryName: string,
 *   eventType: 'sale' | 'no-sale',
 *   purchasedItemText?: string,
 *   quantity?: number,
 *   customerReason?: string,
 *   customerTemperament?: string,
 *   totalPriceG?: number,
 *   isWholesale?: boolean
 * }
 */

function _shopFallbackComment(payload) {
  var categoryName = (payload.categoryName || 'このカテゴリ').toString();
  var purchasedItemText = (payload.purchasedItemText || '品物').toString();
  var qty = typeof payload.quantity === 'number' ? payload.quantity : 1;

  if (payload.eventType === 'sale') {
    var saleLines = [
      'ちょうど欲しい品でした。また覗きに来ます！',
      '助かりました。品ぞろえが良いですね。',
      '想像より良い出来です。仲間にも勧めます。'
    ];
    var line = saleLines[Math.floor(Math.random() * saleLines.length)];
    return purchasedItemText + (qty > 1 ? 'を' + qty + '個、' : '、') + line;
  }

  var noSaleLines = [
    categoryName + '狙いだったので、次回また来ます。',
    '今日は見つからなかったので、入荷を待っています。',
    '欲しいものはなかったですが、また立ち寄ります。'
  ];
  return noSaleLines[Math.floor(Math.random() * noSaleLines.length)];
}

function _shopExtractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  var trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (err) {}

  var start = trimmed.indexOf('{');
  if (start < 0) return null;
  var depth = 0;
  for (var i = start; i < trimmed.length; i++) {
    if (trimmed[i] === '{') depth++;
    if (trimmed[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(trimmed.substring(start, i + 1));
        } catch (e) {
          return null;
        }
      }
    }
  }
  return null;
}

function _generateShopCommentWithAI(payload) {
  var apiKey = Config.getOpenAiApiKey();
  if (!apiKey) return null;

  var eventType = payload.eventType === 'no-sale' ? 'no-sale' : 'sale';
  var workshopName = (payload.workshopName || '工房').toString().slice(0, 30);
  var customerName = (payload.customerName || 'お客').toString().slice(0, 30);
  var categoryName = (payload.categoryName || '商品').toString().slice(0, 20);
  var purchasedItemText = (payload.purchasedItemText || '').toString().slice(0, 80);
  var quantity = typeof payload.quantity === 'number' ? Math.max(1, Math.min(50, payload.quantity)) : 1;
  var customerReason = (payload.customerReason || '').toString().slice(0, 80);
  var customerTemperament = (payload.customerTemperament || '').toString().slice(0, 20);
  var hasValidTotalPrice = typeof payload.totalPriceG === 'number' && isFinite(payload.totalPriceG);
  var totalPriceG = hasValidTotalPrice ? Math.max(0, Math.floor(payload.totalPriceG)) : null;
  var isWholesale = !!payload.isWholesale;

  var prompt = 'あなたはファンタジー世界の買い物客です。錬金術工房での接客直後に表示する、お客様の一言コメントを日本語で1つ作成してください。\n' +
    'ゲームUI用の短文ですが、定型文ではなく、その場の体験が伝わる表現にしてください。\n' +
    '40〜85文字程度。絵文字は使わない。丁寧口調で自然な話し言葉。\n' +
    '「{工房名}で{商品}をX個買えました」のような固定パターンは避ける。\n' +
    '購入できた/できなかった結果だけでなく、来店理由・雰囲気・次の行動・品質感のどれかを1つ以上入れる。\n' +
    '大げさな賛辞、説明調、メタ発言（AI/生成など）は禁止。\n' +
    '出力はコメント本文のみ（お客様名やラベルを含めない）。\n' +
    '工房名: ' + workshopName + '\n' +
    'お客様名: ' + customerName + '\n' +
    '希望カテゴリ: ' + categoryName + '\n' +
    '結果: ' + (eventType === 'sale' ? '購入成功' : '購入なしで退店') + '\n';

  if (customerReason) prompt += '来店理由: ' + customerReason + '\n';
  if (customerTemperament) prompt += 'お客様の気質: ' + customerTemperament + '\n';
  if (isWholesale) prompt += '購入タイプ: 大口の買い付け\n';

  if (eventType === 'sale') {
    prompt += '購入した商品: ' + (purchasedItemText || '商品') + '\n' +
      '購入数: ' + quantity + '個\n';
    if (totalPriceG !== null) prompt += '合計金額: ' + totalPriceG + 'G\n';
  }

  prompt += '文体のヒント: 一文または二文。語尾・言い回しを毎回変える。\n';

  prompt += '\n' +
    '返答は必ずJSONのみ。形式: {"comment":"..."}';

  try {
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: (typeof Config.getOpenAiModel === 'function' ? Config.getOpenAiModel() : 'gpt-4o-mini'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.9
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var raw = res.getContentText();
    var body;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      return null;
    }
    if (code !== 200 || !body.choices || !body.choices[0] || !body.choices[0].message) return null;
    var parsed = _shopExtractJsonFromText(body.choices[0].message.content || '');
    var comment = parsed && parsed.comment ? String(parsed.comment) : '';
    comment = comment.replace(/\s+/g, ' ').trim();
    if (!comment) return null;
    return comment.slice(0, 90);
  } catch (err) {
    return null;
  }
}

function handleShopComment(e) {
  var body = Utils.parseBody(e);
  var payload = {
    userId: body.userId || '',
    workshopName: body.workshopName || '',
    customerName: body.customerName || '',
    categoryName: body.categoryName || '',
    eventType: body.eventType || 'sale',
    purchasedItemText: body.purchasedItemText || '',
    quantity: typeof body.quantity === 'number' ? body.quantity : Number(body.quantity || 1),
    customerReason: body.customerReason || '',
    customerTemperament: body.customerTemperament || '',
    totalPriceG: (function(v) {
      var n = typeof v === 'number' ? v : Number(v);
      return isFinite(n) ? n : null;
    })(body.totalPriceG),
    isWholesale: !!body.isWholesale
  };

  if (!payload.customerName) return { error: 'customerName is required' };
  if (!payload.categoryName) return { error: 'categoryName is required' };

  var comment = _generateShopCommentWithAI(payload);
  if (comment) {
    return { ok: true, source: 'ai', comment: comment };
  }
  return { ok: true, source: 'fallback', comment: _shopFallbackComment(payload) };
}

function handleShop(e, method, path) {
  var parts = path.split('/');
  var subAction = parts[1];
  if (method === 'POST' && subAction === 'comment') return handleShopComment(e);
  return { error: 'Unknown shop action' };
}
