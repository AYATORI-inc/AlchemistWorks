/**
 * 認証・ログイン
 * POST /auth/login
 * body: { userName, workshopName }
 *
 * 同じ userName + workshopName から常に同じ userId を生成する（既存ユーザー続きプレイ対応）
 */
function handleAuthLogin(e) {
  var body = Utils.parseBody(e);
  var userName = (body.userName || '').trim();
  var workshopName = (body.workshopName || '').trim();

  if (!userName || !workshopName) {
    return { error: 'userName and workshopName are required' };
  }

  var userId = _toUserId(userName, workshopName);
  var folderId = ''; // TODO: Drive.createFolder(userId, userName, workshopName);

  // 既存セーブがあれば g は save.get で上書きされる。新規は 0G 開始
  var g = 0;

  return {
    userId: userId,
    folderId: folderId,
    g: g
  };
}

/**
 * userName + workshopName から確定論的 userId を生成
 * 同じ組み合わせなら常に同じ ID になる
 */
function _toUserId(userName, workshopName) {
  var raw = (userName + '|' + workshopName).toLowerCase();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw, Utilities.Charset.UTF_8);
  var hex = digest.map(function(b) {
    return (b < 0 ? b + 256 : b).toString(16);
  }).join('');
  return 'u_' + hex.slice(0, 24);
}
