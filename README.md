# 🎴 고스톱 - 컴퓨터 대전 화투 게임

디지털 초보 어르신을 위한 **고스톱** 웹 게임입니다.  
실물 화투 카드 그림으로 컴퓨터와 대결합니다.

## ✨ 특징

- **실물 화투 카드** — 오픈소스 화투 일러스트 적용
- **AI 대전** — 컴퓨터와 1:1 대결
- **자동 저장** — LocalStorage에 진행 상황 저장
- **어르신 친화 UI** — 큰 카드, 큰 버튼, 쉬운 조작
- **PC·스마트폰** 반응형 지원

## 🎮 게임 방법

1. 패에서 카드 1장을 선택합니다
2. 같은 **월(숫자)** 카드가 바닥에 있으면 가져갑니다
3. 이후 덱에서 카드 1장이 자동으로 열립니다
4. **3점 이상**이면 **고** 또는 **스톱**을 선택합니다
5. 목표 점수에 먼저 도달하면 승리!

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📦 빌드

```bash
npm run build
```

## 🌐 Vercel 배포

### 1. GitHub에 올리기

```bash
git init
git add .
git commit -m "고스톱 2인용 게임 초기 버전"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gostop-game.git
git push -u origin main
```

### 2. Vercel 연결

1. [vercel.com](https://vercel.com) 접속 후 GitHub 계정 연결
2. **New Project** → `gostop-game` 저장소 선택
3. Framework Preset: **Vite** (자동 감지)
4. **Deploy** 클릭

별도 설정 없이 바로 배포됩니다.

## 🛠 기술 스택

- React 19
- Vite 8
- JavaScript (JSX)
- LocalStorage

## 📁 프로젝트 구조

```
src/
├── data/cards.js        # 화투 48장 정의
├── logic/
│   ├── deck.js          # 셔플, 딜링
│   ├── scoring.js       # 족보 점수 계산
│   └── gameEngine.js    # 게임 진행 로직
├── storage/
│   └── gameStorage.js   # LocalStorage 저장/불러오기
└── components/          # UI 컴포넌트
```

## 📄 카드 이미지 라이선스

화투 카드 이미지는 [freegostop 오픈소스](https://github.com/sunduk/freegostop) 프로젝트에서 제공하며, 상업·비상업 용도 모두 자유롭게 사용 가능합니다.

## 📄 라이선스

MIT
