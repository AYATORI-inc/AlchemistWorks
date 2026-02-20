/**
 * 錬金術シミュレータ GAS バックエンド
 * エントリポイント
 */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  var path = '';
  if (method === 'GET') {
    path = (e?.parameter?.path || e?.pathInfo || '').replace(/^\//, '') || 'index';
  } else {
    var body = e?.postData?.contents ? JSON.parse(e.postData.contents) : {};
    path = (body.path || e?.parameter?.path || '').replace(/^\//, '') || 'index';
  }
  var action = path.split('/')[0];
  
  let result;
  try {
    switch (action) {
      case 'authorize':
        // 認可テスト: ブラウザで開くと external_request 権限の同意画面が出る
        try {
          UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
          result = { ok: true, message: '認可OK。エディタで testDailyItemGeneration を実行してください。' };
        } catch (err) {
          result = { error: err.message || 'UrlFetchApp 権限エラー' };
        }
        break;
      case 'auth':
        result = method === 'POST' ? handleAuthLogin(e) : { error: 'Method not allowed' };
        break;
      case 'save':
        result = method === 'GET' ? handleSaveGet(e) : handleSavePost(e);
        break;
      case 'market':
        result = handleMarket(e, method, path);
        break;
      case 'alchemy':
        result = method === 'POST' ? handleAlchemy(e) : { error: 'Method not allowed' };
        break;
      case 'missions':
        result = handleMissions(e, method, path);
        break;
      case 'recipes':
        result = method === 'GET' ? handleRecipesGet(e) : { error: 'Method not allowed' };
        break;
      default:
        result = { message: '錬金術シミュレータ API', version: '0.1.0' };
    }
  } catch (err) {
    result = { error: err.message || 'Internal error' };
  }
  
  return Utils.jsonResponse(result);
}
