# キャラクター画像

現在は `components/CharacterArt.tsx` のインライン SVG をプレースホルダーとして使用しています。
本番のオリジナルアートに差し替える手順は以下の通りです。

## 差し替え手順

1. 4 段階分の画像をこのフォルダに配置します（透過 PNG、正方形キャンバス推奨、512×512 以上）。
   ```
   public/characters/stage-1.png
   public/characters/stage-2.png
   public/characters/stage-3.png
   public/characters/stage-4.png
   ```
   （任意でレティナ用 `stage-N@2x.png`）
2. `components/CharacterCard.tsx` と `components/EvolutionGallery.tsx` の
   `CharacterArt` を `next/image` に置き換え、`imageForStage(stage)`（`lib/character.ts`）が返す
   パスを `src` に使います。

## スタイルガイド（AI 生成プロンプトの指針）

一貫した「同一個体の進化」に見せるため、全段階で以下を固定すること:

- **世界観**: ポケモンのようなかわいいオリジナルのモンスター（※既存キャラの模倣・流用は不可）
- **配色**: 段階ごとにテーマカラーを変えつつ、目・口・全体のシルエットの一貫性を保つ
  - stage1: 黄緑（芽生え） / stage2: 水色（論理） / stage3: 紫（成熟） / stage4: 金（完全体）
- **構図**: 正面・全身・透過背景・正方形・余白を均一に
- **進化の演出**: 段階が上がるほど 大きく・装飾（耳→翼→王冠）が増える
- **テイスト**: フラットでポップ、太めの輪郭線、視認性の高い目

### プロンプト例

```
A cute original monster creature mascot, front view, full body, flat vector style,
thick outlines, big friendly eyes, transparent background, square composition.
Evolution stage {N} of 4: stage1 small sprout (yellow-green), stage2 fox-like (sky blue),
stage3 wolf-like with small wings (purple), stage4 majestic with a crown (gold).
Keep the same character identity and silhouette across all stages. No text.
```

生成後は手で選別し、4 段階を**1 セッションで通して生成**して世界観を揃えること。
