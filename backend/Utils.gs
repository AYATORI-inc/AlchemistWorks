/**
 * ユーティリティ
 */

var Utils = {
  /**
   * JSONレスポンスを返す（CORS対応）
   */
  jsonResponse: function(data) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  },
  
  /**
   * POSTボディをパース
   */
  parseBody: function(e) {
    try {
      return e?.postData?.contents ? JSON.parse(e.postData.contents) : {};
    } catch (err) {
      return {};
    }
  },
  
  /**
   * クエリパラメータ取得
   */
  getParam: function(e, name) {
    return e?.parameter?.[name] || null;
  }
};
