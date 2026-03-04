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
 *   customerType?: 'normal' | 'budget' | 'wholesale',
 *   maxItemPriceG?: number,
 *   totalPriceG?: number,
 *   isWholesale?: boolean
 * }
 */

var SHOP_COMMENT_TEMPLATES = {
  sale: {
    base: [
      '{itemLead}ちょうど必要だったので助かりました。',
      '{itemLead}使う場面に合いそうで安心しました。',
      '{itemLead}見た目より実用的で、すぐ役に立ちそうです。',
      '{itemLead}この出来なら、また同じ工房で選びたいです。',
      '{itemLead}探し回らずに済んで、今日は運がよかったです。',
      '{itemLead}手に取った感触がよくて、納得して買えました。',
      '{itemLead}想像していた用途にぴったりで、判断しやすかったです。',
      '{itemLead}品質が安定していて、安心して持ち帰れます。',
      '{itemLead}仕上がりがきれいで、使うのが楽しみです。',
      '{itemLead}必要な時に見つかって、本当に助かりました。',
      '{itemLead}迷わず決められる品ぞろえでありがたいです。'
    ],
    wholesale: [
      '{itemLead}数がそろっていて、仕入れが一度で済みました。',
      '{itemLead}在庫が安定していて、まとめ買いしやすいですね。',
      '{itemLead}この量を確保できたので、現場へすぐ回せます。',
      '{itemLead}まとめてそろえられて、段取りがかなり楽になりました。',
      '{itemLead}必要数を一度で押さえられて、移動回数を減らせます。',
      '{itemLead}欠品を気にせず組めるので、計画が立てやすいです。'
    ],
    budget: [
      '{itemLead}無理のない額で手に入り、財布にも優しかったです。',
      '{itemLead}予算内で収まって、安心して持ち帰れます。',
      '{itemLead}値段と品質のつり合いがよくて助かりました。',
      '{itemLead}この価格なら、日常使いとして続けやすいです。',
      '{itemLead}出費を抑えつつ必要な物を確保できました。'
    ],
    impatient: [
      '{itemLead}待たずに決められて助かりました。急ぎの用事に間に合います。',
      '{itemLead}すぐ見つかったので、次の予定に遅れずに済みます。',
      '{itemLead}短時間で用件が済んで、かなり助かりました。',
      '{itemLead}急ぎの準備だったので、この早さはありがたいです。'
    ],
    relaxed: [
      '{itemLead}ゆっくり選べて、満足のいく買い物になりました。',
      '{itemLead}急がず選べたので、納得して持ち帰れます。',
      '{itemLead}落ち着いて選べて、気分よく買い物できました。',
      '{itemLead}細かな違いまで見られて、良い選択ができました。'
    ],
    reasonHint: [
      '{reason}ので、今回の品はそのまま使えそうで助かります。',
      '{reason}ので、準備がこれでひとつ前に進みます。',
      '{reason}ので、必要な条件を満たせそうで安心しました。',
      '{reason}ので、次の段取りに入りやすくなりました。'
    ],
    category: {
      '食べ物': [
        '{itemLead}香りがよくて、食卓が楽しみになります。',
        '{itemLead}旅先でも扱いやすそうで、重宝しそうです。',
        '{itemLead}保存もしやすそうで、仕込みが楽になります。',
        '{itemLead}味の組み立てがしやすい素材感で助かります。'
      ],
      '武器': [
        '{itemLead}重さのバランスがよく、扱いやすそうです。',
        '{itemLead}作業と戦闘のどちらでも使い分けしやすいですね。',
        '{itemLead}手になじみやすく、振りの感触が良いですね。',
        '{itemLead}耐久に期待できそうで、遠征でも頼れそうです。'
      ],
      '薬': [
        '{itemLead}効き目と扱いやすさの両方を期待できます。',
        '{itemLead}備えとして置いておくと心強いです。',
        '{itemLead}必要な時にすぐ使える形で助かります。',
        '{itemLead}常備分として回しやすく、管理しやすいです。'
      ],
      '宝石': [
        '{itemLead}色味が良く、細工に映えそうです。',
        '{itemLead}魔力の通りがよさそうで、用途が広がります。',
        '{itemLead}透明感がきれいで、加工後の見栄えが期待できます。',
        '{itemLead}粒のそろいが良く、仕立てがしやすそうです。'
      ]
    },
    temperamentCategory: {
      impatient: {
        '武器': [
          '{itemLead}急ぎの護衛任務に間に合いそうです。',
          '{itemLead}準備時間が短くても即戦力になります。'
        ],
        '薬': [
          '{itemLead}緊急時の備えがすぐ整って助かります。',
          '{itemLead}急患対応の準備にすぐ回せます。'
        ]
      },
      relaxed: {
        '食べ物': [
          '{itemLead}味見しながら献立を考えるのが楽しみです。',
          '{itemLead}ゆっくり仕込みに使えるのでうれしいです。'
        ],
        '宝石': [
          '{itemLead}細工の時間を取りながら丁寧に仕上げられそうです。',
          '{itemLead}配色をじっくり選ぶ余裕ができました。'
        ]
      }
    }
  },
  'no-sale': {
    base: [
      '{category}目当てだったので、今日は見送っておきます。',
      '欲しい条件に合う品が見つからず、また改めて来ます。',
      '急ぎではないので、次の入荷の時にのぞきます。',
      '品ぞろえは面白かったので、次回に期待しています。',
      '今日は縁がなかったようなので、日を改めます。',
      '条件に合う品がそろう頃に、もう一度見に来ます。',
      '相談したい方向性は固まったので、次回また寄ります。',
      '今回は見送りますが、工房の雰囲気は気に入りました。'
    ],
    wholesale: [
      'まとめて必要な数に届かなかったので、次便で再訪します。',
      '大口分をそろえるには少し足りないので、また確認に来ます。',
      '継続供給が必要なので、在庫がまとまった頃に来ます。',
      '数量条件を満たす必要があるため、次の補充を待ちます。'
    ],
    budget: [
      '予算内で選べる品が少なかったので、次の入荷を待ちます。',
      '価格条件に合うものが見当たらず、今日は控えておきます。',
      '出費を抑えたいので、値ごろな品が増えたらまた来ます。',
      '今月の予算だと難しいので、次回の棚替えで再確認します。'
    ],
    impatient: [
      '時間が迫っているので、今日は別の用事を先に済ませます。',
      '急ぎの案件があるため、今回は見送りにします。',
      'この後の予定が詰まっているので、改めて寄らせてください。',
      '急ぎの移動があるので、今日は短時間で切り上げます。'
    ],
    relaxed: [
      '急がない用件なので、良い品がそろう頃にまた来ます。',
      '今日は下見だけにして、次回じっくり選びます。',
      '焦らず探したいので、また時間を取って見に来ます。',
      '比較して決めたいので、次回ゆっくり相談します。'
    ],
    reasonHint: [
      '{reason}ので、次はもう少し見たいです。',
      '{reason}ので、候補が増えたらまた相談させてください。',
      '{reason}ので、条件に合う品を次回もう一度見ます。',
      '{reason}ので、使える品が入った頃に再訪します。'
    ],
    category: {
      '食べ物': [
        '保存向きの食材がほしかったので、次回の棚替えでまた見ます。',
        '食べ物の種類が増える頃に、改めて立ち寄ります。',
        '献立に合う食べ物を探しているので、次回また確認します。'
      ],
      '武器': [
        '装備更新に合う武器が今回は見つからず、再訪します。',
        '武器は妥協したくないので、次の品出しを待ちます。',
        '訓練用に合う武器がほしいので、次回の在庫を見ます。'
      ],
      '薬': [
        '薬は用途に合うものを選びたいので、また確認に来ます。',
        '薬の在庫が増えた頃に、もう一度相談したいです。',
        '常備向けの薬を探しているので、入荷後に再訪します。'
      ],
      '宝石': [
        '宝石は色と質で選びたいので、次回また見に来ます。',
        '加工向きの宝石を探しているので、入荷後に再訪します。',
        '宝石は粒のそろいを見たいので、次回改めて選びます。'
      ]
    },
    temperamentCategory: {
      impatient: {
        '武器': [
          '急ぎの装備更新なので、次回すぐ決められる品を見に来ます。',
          '武器の確認に時間をかけられないので、また短時間で寄ります。'
        ],
        '薬': [
          '急ぎで使う薬なので、条件に合う在庫がそろったらすぐ来ます。',
          '薬の補充を急いでいるため、次回改めて確認します。'
        ]
      },
      relaxed: {
        '食べ物': [
          '食べ物はゆっくり選びたいので、また落ち着いた頃に来ます。',
          '味の組み合わせを見ながら決めたいので、次回また寄ります。'
        ],
        '宝石': [
          '宝石は光の具合も見たいので、次回じっくり選びます。',
          '加工前に比較したいので、また時間を取って見に来ます。'
        ]
      }
    }
  }
};

function _shopNormalizePayload(payload) {
  var eventType = payload.eventType === 'no-sale' ? 'no-sale' : 'sale';
  var customerName = (payload.customerName || 'お客').toString().slice(0, 30);
  var categoryName = (payload.categoryName || '商品').toString().slice(0, 20);
  var purchasedItemText = (payload.purchasedItemText || '品物').toString().slice(0, 80);
  var quantity = typeof payload.quantity === 'number' ? Math.max(1, Math.min(50, payload.quantity)) : 1;
  var customerReason = (payload.customerReason || '').toString().slice(0, 80);
  var customerTemperament = (payload.customerTemperament || '').toString().slice(0, 20);
  var customerType = (payload.customerType || '').toString();
  if (customerType !== 'budget' && customerType !== 'wholesale') customerType = 'normal';
  var maxItemPriceG = typeof payload.maxItemPriceG === 'number' ? Math.max(0, Math.floor(payload.maxItemPriceG)) : null;
  var isWholesale = !!payload.isWholesale;
  return {
    eventType: eventType,
    customerName: customerName,
    categoryName: categoryName,
    purchasedItemText: purchasedItemText,
    quantity: quantity,
    customerReason: customerReason,
    customerTemperament: customerTemperament,
    customerType: customerType,
    maxItemPriceG: maxItemPriceG,
    isWholesale: isWholesale
  };
}

function _shopPick(arr) {
  if (!arr || !arr.length) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function _shopTemperamentKey(label) {
  if (label === 'せっかち') return 'impatient';
  if (label === 'のんびり') return 'relaxed';
  return 'normal';
}

function _shopBuildItemLead(context) {
  if (context.eventType !== 'sale') return '';
  var itemText = context.purchasedItemText || '品物';
  var qty = typeof context.quantity === 'number' ? Math.max(1, context.quantity) : 1;
  var variants = qty > 1
    ? [
        itemText + 'を' + qty + '個買いました。',
        itemText + 'を' + qty + '個購入しました。',
        itemText + 'を' + qty + '個、まとめて確保できました。',
        itemText + 'を' + qty + '個手に入れました。',
        itemText + 'を' + qty + '個そろえられました。'
      ]
    : [
        itemText + 'を買いました。',
        itemText + 'を購入しました。',
        itemText + 'を手に入れました。',
        itemText + 'を一つ確保できました。',
        itemText + 'を選んで持ち帰ることにしました。'
      ];
  return _shopPick(variants);
}

function _shopInterpolate(template, context) {
  return template
    .replace(/\{itemLead\}/g, _shopBuildItemLead(context))
    .replace(/\{reason\}/g, context.customerReason || context.categoryName)
    .replace(/\{category\}/g, context.categoryName);
}

function _shopComposeComment(context) {
  var group = SHOP_COMMENT_TEMPLATES[context.eventType];
  if (!group) return context.categoryName + 'を見に、また寄らせてもらいます。';

  var candidates = [];
  candidates = candidates.concat(group.base || []);

  if (context.isWholesale && group.wholesale) candidates = candidates.concat(group.wholesale);
  if ((context.customerType === 'budget' || context.maxItemPriceG !== null) && group.budget) candidates = candidates.concat(group.budget);

  var temperamentKey = _shopTemperamentKey(context.customerTemperament);
  if (temperamentKey === 'impatient' && group.impatient) candidates = candidates.concat(group.impatient);
  if (temperamentKey === 'relaxed' && group.relaxed) candidates = candidates.concat(group.relaxed);

  if (context.customerReason && group.reasonHint) candidates = candidates.concat(group.reasonHint);

  if (group.category && group.category[context.categoryName]) {
    candidates = candidates.concat(group.category[context.categoryName]);
  }
  if (group.temperamentCategory &&
      group.temperamentCategory[temperamentKey] &&
      group.temperamentCategory[temperamentKey][context.categoryName]) {
    candidates = candidates.concat(group.temperamentCategory[temperamentKey][context.categoryName]);
  }

  if (context.eventType === 'sale' && context.quantity >= 3 && group.wholesale) {
    candidates = candidates.concat(group.wholesale);
  }

  var picked = _shopPick(candidates);
  if (!picked) picked = _shopPick(group.base || []);
  if (!picked) picked = context.categoryName + 'を見に、また寄らせてもらいます。';

  return _shopInterpolate(picked, context).replace(/\s+/g, ' ').trim().slice(0, 90);
}

function _generateShopCommentFromPreset(payload) {
  var context = _shopNormalizePayload(payload);
  return _shopComposeComment(context);
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
    customerType: body.customerType || 'normal',
    maxItemPriceG: (function(v) {
      var n = typeof v === 'number' ? v : Number(v);
      return isFinite(n) ? n : null;
    })(body.maxItemPriceG),
    totalPriceG: (function(v) {
      var n = typeof v === 'number' ? v : Number(v);
      return isFinite(n) ? n : null;
    })(body.totalPriceG),
    isWholesale: !!body.isWholesale
  };

  if (!payload.customerName) return { error: 'customerName is required' };
  if (!payload.categoryName) return { error: 'categoryName is required' };

  var comment = _generateShopCommentFromPreset(payload);
  return { ok: true, source: 'preset', comment: comment };
}

function handleShop(e, method, path) {
  var parts = path.split('/');
  var subAction = parts[1];
  if (method === 'POST' && subAction === 'comment') return handleShopComment(e);
  return { error: 'Unknown shop action' };
}
