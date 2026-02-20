/**
 * SVGアイコン生成（OpenAI 用）
 * アイテムを作成した後、別途詳細なSVGアイコンを生成する
 * viewBox 0 0 24 24 用のpathのd属性とfill色を返す
 */

/**
 * 単一アイテム用のSVGアイコンを生成
 * @param {Object} item - { itemId, name, description または flavor }
 * @returns {{ path: string, fill: string } | null} 失敗時はnull
 */
function SvgIcon_generateForItem(item) {
  var apiKey = Config.getOpenAiApiKey();
  if (!apiKey) return null;

  var itemId = (item.itemId || item.id || 'item').toString();
  var name = (item.name || '').toString().slice(0, 30);
  var desc = (item.description || item.flavor || '').toString().slice(0, 80);
  var context = desc ? '説明: ' + desc : '';

  var prompt =
    '錬金術ゲームのアイテム「' + name + '」(id: ' + itemId + ') のアイコン用SVGを1つ生成してください。\n' +
    (context ? context + '\n' : '') +
    'viewBox 0 0 24 24 の範囲で、アイテムの形が分かる具体的な図形をpathのd属性で描いてください。\n' +
    '【形式】Mで始まるSVG pathのd属性（例: 剣"M12 2l2 4h-4l2 4l-2 8h4l-2-8 2-4h-4z"、瓶"M9 3h6v2H9zm-1 4h8v12c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V7z"）。\n' +
    '【色】メイン色をsvgFillにhexコードで指定（例: #4caf50）。\n' +
    '必ず以下のJSON形式のみで返してください（他テキストなし）:\n' +
    '{"svgPath":"M12 2...","svgFill":"#4caf50"}';

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
    var path = (parsed.svgPath || '').toString().replace(/[<>"']/g, '').slice(0, 500);
    var fill = (parsed.svgFill || '#666').toString().match(/^#[0-9A-Fa-f]{3,8}$/) ? parsed.svgFill : '#666';
    if (!path || path.length < 5) return null;
    return { path: path, fill: fill };
  } catch (err) {
    return null;
  }
}

/**
 * 複数アイテム用のSVGアイコンを一括生成
 * @param {Array.<Object>} items - [{ itemId, name, flavor }, ...]
 * @returns {Array.<Object>} 各要素に svgPath, svgFill が追加された配列（失敗したものはundefinedのまま）
 */
function SvgIcon_generateForItems(items) {
  if (!items || items.length === 0) return [];
  var apiKey = Config.getOpenAiApiKey();
  if (!apiKey) return items;

  var list = items.map(function(it, i) {
    return { idx: i, itemId: it.itemId || it.id || 'item', name: it.name || '謎の品', flavor: it.flavor || '' };
  });

  var itemsDesc = list.map(function(it) {
    return '[' + it.idx + '] id:' + it.itemId + ' 名前:' + it.name + (it.flavor ? ' 説明:' + it.flavor.slice(0, 40) : '');
  }).join('\n');

  var prompt =
    '錬金術ゲームの以下の' + list.length + 'アイテムそれぞれに対し、viewBox 0 0 24 24用のSVGアイコンを生成してください。\n\n' +
    itemsDesc + '\n\n' +
    '各アイテムに svgPath（Mで始まるpathのd属性）と svgFill（hex色コード）を付けてください。物の形が分かる具体的な図形にしてください。\n' +
    '必ず以下のJSON形式のみで返してください（他テキストなし）:\n' +
    '{"icons":[{"idx":0,"svgPath":"M12 2...","svgFill":"#4caf50"},{"idx":1,"svgPath":"...","svgFill":"..."},...]}';

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
    if (code !== 200 || !body.choices || !body.choices[0]) return items;
    var text = body.choices[0].message.content;
    var parsed = JSON.parse(text);
    var icons = parsed.icons || parsed.iconList || [];
    if (!Array.isArray(icons)) return items;

    var out = items.slice();
    icons.forEach(function(ic) {
      var idx = typeof ic.idx === 'number' ? ic.idx : parseInt(ic.idx, 10);
      if (idx < 0 || idx >= out.length) return;
      var path = (ic.svgPath || '').toString().replace(/[<>"']/g, '').slice(0, 500);
      var fill = (ic.svgFill || '#666').toString().match(/^#[0-9A-Fa-f]{3,8}$/) ? ic.svgFill : '#666';
      if (path && path.length >= 5) {
        out[idx] = Object.assign({}, out[idx], { svgPath: path, svgFill: fill });
      }
    });
    return out;
  } catch (err) {
    return items;
  }
}
