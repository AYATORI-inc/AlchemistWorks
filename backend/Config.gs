/**
 * スクリプトプロパティから設定を読み込む
 * GAS エディタ: プロジェクトの設定 → スクリプト プロパティ で以下を設定
 *
 * | プロパティ名 | 説明 | 例 |
 * |--------------|------|-----|
 * | OPENAI_API_KEY | OpenAI API キー | sk-xxxxx |
 * | OPENAI_MODEL | OpenAI モデル（錬金・ミッションAI用） | gpt-4o-mini |
 * | SAVE_FOLDER_ID | データ保存先フォルダID（Drive URLの末尾） | 1TKdbKEORRRQ9CUUMNXFkq8C97kBRzXbd |
 * | SAVE_USE_DRIVE | Drive使用（false=スクリプトプロパティに保存） | true / false |
 * | SAVE_FOLDER_NAME | フォルダ名（未使用） | AlchemistWorks |
 */

var Config = {
  /** OpenAI API キー（スクリプトプロパティ） */
  getOpenAiApiKey: function() {
    return PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') || '';
  },

  /** OpenAI モデル（スクリプトプロパティ、未設定時は gpt-4o-mini） */
  getOpenAiModel: function() {
    return PropertiesService.getScriptProperties().getProperty('OPENAI_MODEL') || 'gpt-4o';
  },

  /** Drive を使用するか（false で PropertiesService のみ） */
  useDrive: function() {
    return PropertiesService.getScriptProperties().getProperty('SAVE_USE_DRIVE') !== 'false';
  },

  /** 保存先フォルダID（未設定時は getSaveFolderName でマイドライブ内を自動作成） */
  getSaveFolderId: function() {
    if (!this.useDrive()) return null;
    return PropertiesService.getScriptProperties().getProperty('SAVE_FOLDER_ID') || null;
  },

  /** 既定フォルダ名（SAVE_FOLDER_ID 未設定時にマイドライブ内で使用） */
  getSaveFolderName: function() {
    return PropertiesService.getScriptProperties().getProperty('SAVE_FOLDER_NAME') || '錬金術シミュレータ';
  }
};
