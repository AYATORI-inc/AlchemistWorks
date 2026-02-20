# 錬金術シミュレータ GAS バックエンド

## デプロイ手順

1. [Google Apps Script](https://script.google.com) で新規プロジェクトを作成
2. このフォルダ内の `.gs` ファイルの内容を、GASエディタの対応するファイルにコピー
3. **スクリプトプロパティを設定**（下記「スクリプトプロパティ」参照）
4. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
5. 説明を入力し、デプロイ
6. ウェブアプリのURLをコピーし、フロントの `.env` に設定:
   ```
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

## スクリプトプロパティ

GAS エディタで **プロジェクトの設定**（歯車アイコン）→ **スクリプト プロパティ** を開き、以下を追加してください。

| プロパティ名 | 説明 | 例 |
|--------------|------|-----|
| `OPENAI_API_KEY` | OpenAI API キー（錬金・日替わり・ミッションAI用） | `sk-xxxxx` |
| `OPENAI_MODEL` | OpenAI モデル | `gpt-4o-mini` |
| `SAVE_FOLDER_ID` | Drive 保存先フォルダID（URL末尾） | （空でOK） |
| `SAVE_USE_DRIVE` | Drive 使用（`false` で無効化） | `false` |

**Drive の既定保存**（おすすめ）:
- `SAVE_FOLDER_ID` を**設定しない**と、デプロイアカウントの**マイドライブ**内に「錬金術シミュレータ」フォルダが自動作成され、そこに保存されます
- フォルダ共有は不要で、そのまま利用できます

**Drive を無効にする場合**:
- `SAVE_USE_DRIVE` を `false` に設定すると、PropertiesService に保存されます

## API 呼び出し形式

GASの制約により、パスはクエリ（GET）またはbody（POST）で渡す。

- GET: `?path=auth&userId=xxx`
- POST: body に `{ "path": "alchemy", "userId": "xxx", "ingredients": ["herb","water"], "pace": "normal" }`

## ファイル構成

| ファイル | 役割 |
|----------|------|
| Main.gs | エントリ・ルーティング |
| Config.gs | スクリプトプロパティ（APIキー・保存フォルダ） |
| Utils.gs | 共通ユーティリティ |
| Auth.gs | ログイン・フォルダ作成 |
| Save.gs | セーブ読み書き |
| Market.gs | 市場・日替わりアイテム |
| Alchemy.gs | 錬金（OpenAI） |
| SvgIcon.gs | AIによるSVGアイコン生成 |
| Missions.gs | ミッション取得・達成 |
| Recipes.gs | レシピ一覧 |
| Drive.gs | Google Drive 操作（SAVE_USE_DRIVE=true 時） |

**重要**: 日替わりアイテムや錬金成果物のSVGアイコンを表示するには、**全ファイル**（特に `SvgIcon.gs`）をGASに反映し、再デプロイしてください。
