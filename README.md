# D-day Widget Studio

Cloudflare Pages에 바로 올릴 수 있는 정적 D-day 위젯입니다. 설정값은 URL 쿼리에 저장되며 서버나 데이터베이스가 필요 없습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## Cloudflare Pages 배포

Git 저장소를 Pages에 연결하는 경우:

- Build command: 비워 둠
- Build output directory: `public`

Wrangler로 직접 배포하는 경우:

```bash
npm run deploy -- --project-name=dday-widget-studio
```

배포 후 편집 화면에서 **임베드 링크 복사**를 누르고 Notion의 `/embed` 블록에 붙여 넣습니다. iframe 안에서는 설정 UI가 자동으로 숨겨집니다. `embed=1`이 포함된 링크는 일반 브라우저에서도 위젯만 표시합니다.
