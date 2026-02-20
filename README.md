# 錬金術シミュレータ

予め用意された素材を合成し、アイテム棚とレシピ帳を充実させる錬金術シミュレータ。  
仕様書: [docs/SPECIFICATION.md](docs/SPECIFICATION.md)

## 構成

| フォルダ | 内容 |
|----------|------|
| `frontend/` | React + TypeScript (Vite) |
| `backend/` | Google Apps Script (GAS) |
| `base-system/` | 元の静的なHTML版 |
| `docs/` | 仕様書 |

## 開発

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173 で起動

### バックエンド (GAS)

1. [Google Apps Script](https://script.google.com) で新規プロジェクト作成
2. `backend/` 内の `.gs` ファイルをGASエディタにコピー
3. デプロイ → ウェブアプリ
4. 発行されたURLを `frontend/.env` に設定:
   ```
   VITE_GAS_URL=https://script.google.com/macros/s/xxxxx/exec
   ```

## 外形の動作

- **ログイン**: 名前・工房名を入力して開始（API未連携時はローカルで動作）
- **錬金**: 所持アイテムを釜にドラッグ→調合ペース選択→調合
- **Tips**: 合成中にTips表示（アニメーションの代わり）
- **ナビ**: ヘッダーから市場・レシピ・ミッション・実績・設定へ遷移

API連携後は、GAS の各エンドポイントと通信します。
