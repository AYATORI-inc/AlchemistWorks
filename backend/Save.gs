/**
 * セーブデータ
 * GET /save?userId=xxx
 * POST /save body: { userId, ...saveData }
 *
 * SAVE_USE_DRIVE !== 'false' のとき: Google Drive に保存
 *   - SAVE_FOLDER_ID あり: そのフォルダを使用
 *   - なし: マイドライブ内に SAVE_FOLDER_NAME のフォルダを自動作成
 * SAVE_USE_DRIVE === 'false' のとき: PropertiesService に保存
 */
var SAVE_KEY_PREFIX = 'save_';

function handleSaveGet(e) {
  var userId = Utils.getParam(e, 'userId');
  if (!userId) return { error: 'userId is required' };

  var defaultData = {
    userId: userId,
    userName: '',
    workshopName: '',
    g: 0,
    inventory: [],
    recipes: [],
    achievements: [],
    rank: 1,
    lastLoginDate: new Date().toISOString().slice(0, 10),
    alchemyCount: 0,
    dailySalesLedger: {
      date: new Date().toISOString().slice(0, 10),
      totalG: 0,
      entries: []
    }
  };

  // Drive 使用時: マイドライブ or 指定フォルダから読み込み
  if (Config.useDrive()) {
    try {
      var driveData = DriveHelper.readJson(userId);
      if (driveData) {
        return { data: driveData };
      }
    } catch (err) {
      Logger.log('Save get from Drive failed: ' + err.message);
      // Drive 失敗時は Props フォールバック（既存ユーザー継続のため）
    }
  }

  // PropertiesService フォールバック（Drive 未使用 or 読み込み失敗時）
  var key = SAVE_KEY_PREFIX + userId;
  var props = PropertiesService.getScriptProperties();
  var json = props.getProperty(key);

  if (!json) {
    return { data: defaultData };
  }

  try {
    var data = JSON.parse(json);
    return { data: data };
  } catch (err) {
    return { data: defaultData };
  }
}

function handleSavePost(e) {
  var body = Utils.parseBody(e);
  var userId = body.userId;
  if (!userId) return { error: 'userId is required' };

  // Drive 使用時: マイドライブ or 指定フォルダに保存
  if (Config.useDrive()) {
    try {
      if (DriveHelper.writeJson(userId, body)) {
        var props = PropertiesService.getScriptProperties();
        var key = SAVE_KEY_PREFIX + userId;
        if (props.getProperty(key)) props.deleteProperty(key);
        return { ok: true };
      }
    } catch (err) {
      Logger.log('Save post to Drive failed (fallback to Properties): ' + err.message);
      // Drive 失敗時は PropertiesService へフォールバック
    }
  }

  // PropertiesService に保存（Drive 未使用 or 失敗時）
  var key = SAVE_KEY_PREFIX + userId;
  var props = PropertiesService.getScriptProperties();
  try {
    props.setProperty(key, JSON.stringify(body));
    return { ok: true };
  } catch (err) {
    return { error: err.message || 'save failed' };
  }
}
