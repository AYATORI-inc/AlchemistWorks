/**
 * Google Drive 操作
 * SAVE_FOLDER_ID が設定されていればそのフォルダを使用。
 * 未設定の場合はマイドライブ（ルート）内に SAVE_FOLDER_NAME のフォルダを自動作成。
 * ファイル名: save_{userId}.json
 */

var DriveHelper = {
  /** 保存先フォルダを取得（ID指定 or マイドライブ内の既定フォルダ） */
  getSaveFolder: function() {
    if (!Config.useDrive()) return null;
    var folderId = Config.getSaveFolderId();
    if (folderId) {
      try {
        return DriveApp.getFolderById(folderId);
      } catch (err) {
        Logger.log('Drive getSaveFolder by ID error: ' + err.message);
        throw new Error('フォルダにアクセスできません（ID: ' + folderId + '）。フォルダが存在するか、編集権限があるか確認してください。詳細: ' + err.message);
      }
    }
    // 既定: マイドライブ内に SAVE_FOLDER_NAME のフォルダを作成または取得
    try {
      var root = DriveApp.getRootFolder();
      var folderName = Config.getSaveFolderName();
      var iter = root.getFoldersByName(folderName);
      if (iter.hasNext()) {
        return iter.next();
      }
      return root.createFolder(folderName);
    } catch (err) {
      Logger.log('Drive getSaveFolder (default) error: ' + err.message);
      throw new Error('マイドライブへのアクセスに失敗しました。詳細: ' + err.message);
    }
  },

  /** ユーザーのセーブファイルを取得 */
  getSaveFile: function(userId) {
    var folder = this.getSaveFolder();
    if (!folder) return null;
    var filename = 'save_' + userId + '.json';
    var files = folder.getFilesByName(filename);
    return files.hasNext() ? files.next() : null;
  },

  /** JSONを読み込み */
  readJson: function(userId) {
    var file = this.getSaveFile(userId);
    if (!file) return null;
    try {
      return JSON.parse(file.getBlob().getDataAsString());
    } catch (err) {
      Logger.log('Drive readJson error: ' + err.message);
      return null;
    }
  },

  /** JSONを書き込み（フォルダ内に保存） */
  writeJson: function(userId, data) {
    var folder = this.getSaveFolder();
    if (!folder) {
      throw new Error('保存先フォルダを取得できません。SAVE_FOLDER_ID を確認してください。');
    }
    var filename = 'save_' + userId + '.json';
    var content = JSON.stringify(data);
    var blob = Utilities.newBlob(content, 'application/json', filename);

    try {
      var file = this.getSaveFile(userId);
      if (file) {
        file.setContent(content);
      } else {
        folder.createFile(blob);
      }
      return true;
    } catch (err) {
      Logger.log('Drive writeJson error: ' + err.message);
      throw new Error('ファイルの作成・更新に失敗しました: ' + err.message);
    }
  },

  /**
   * フォルダアクセスをテスト（GASエディタで testDriveAccess を実行して確認）
   */
  testAccess: function() {
    var result = { ok: false, message: '' };
    try {
      var folder = this.getSaveFolder();
      if (!folder) {
        result.message = 'Drive は無効です（SAVE_USE_DRIVE=false）';
        return result;
      }
      result.ok = true;
      result.folderName = folder.getName();
      result.folderId = folder.getId();
      result.message = 'OK: フォルダ「' + folder.getName() + '」にアクセスできました。';
    } catch (err) {
      result.message = 'エラー: ' + err.message;
    }
    return result;
  }
};

/**
 * GASエディタで実行: Drive 保存先フォルダの接続テスト
 * メニュー「実行」→「testDriveAccess を実行」で確認可能
 */
function testDriveAccess() {
  var r = DriveHelper.testAccess();
  Logger.log(JSON.stringify(r, null, 2));
  if (r.ok) {
    Logger.log('→ セーブは Drive フォルダに保存されるはずです。');
  } else {
    Logger.log('→ SAVE_FOLDER_ID を確認するか、フォルダを GAS デプロイアカウントと共有してください。');
  }
}
