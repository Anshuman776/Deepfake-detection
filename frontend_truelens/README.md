# TruthLens

AI-generated media detection platform.

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── main.jsx          # Entry point
├── App.jsx           # Root component (Navbar, Hero, Footer)
├── constants.js      # All static data (FEATURES, SCAN_STEPS, etc.)
├── theme.js          # Design tokens (colors, card styles, CSS variables)
├── hooks/
│   ├── useBreakpoint.js   # isMobile, isTablet
│   └── useCountUp.js      # Animated number counter
├── utils/
│   ├── format.js          # formatBytes, formatTime
│   └── detection.js       # seededRand, generateProb, sniffUrlMediaType
└── components/
    ├── AnimatedStat.jsx
    ├── HeatmapGrid.jsx
    ├── TimelineBar.jsx
    ├── BottomSheet.jsx
    ├── UploadZone.jsx
    ├── FilePreview.jsx
    ├── ScanProgress.jsx
    ├── TemporalChart.jsx
    ├── AudioAnalyzerPanel.jsx
    ├── VideoAnalyzerPanel.jsx
    ├── AudioVideoAnalyzer.jsx
    ├── ImageHeatmapViewer.jsx
    ├── ScanResult.jsx
    ├── AuthLogin.jsx
    └── AuthSignup.jsx
```
