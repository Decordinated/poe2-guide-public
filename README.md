# POE2 Guide Archive

영상 타임스탬프와 PoB를 근거로 정리한 Path of Exile 2 공개 가이드 사이트입니다.

- 공개 사이트: https://decordinated.github.io/poe2-guide-public/
- 원문 자동자막은 공개 번들에 포함하지 않습니다.
- 검색과 필터는 브라우저에서 동작하며 백엔드가 없습니다.

## Local development

```bash
npm install
npm run dev
```

## Content sync

인접한 비공개 `poe2-guide` 저장소에서 공개 가능한 메타데이터와 `tips.md`, `craft.md`만 동기화합니다.

```bash
npm run sync
npm run lint:data
```

`transcript.md`, 인증정보, 쿠키, 로컬 경로는 공개 번들에 포함하지 않습니다.

## Deploy

`main`에 push하면 GitHub Actions가 정적 번들을 빌드해 GitHub Pages에 배포합니다.
