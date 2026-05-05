/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 잔향 다크 파스텔 토큰 (v2.2 K-콘텐츠 모던 톤)
        bg: {
          primary: '#0F0E14',     // 깊은 자정
          secondary: '#1B1A23',
          elevated: '#2A2935',
        },
        fg: {
          primary: '#E8E3D5',     // 바랜 종이
          muted: '#A8A39A',
          dim: '#6B6760',
        },
        resonance: {
          DEFAULT: '#B89DD0',     // 잔향 — 흐릿한 라벤더
          deep: '#8E72A8',
        },
        origin: {
          DEFAULT: '#D4A574',     // 원 — 빛 바랜 황금
        },
        danger: '#C44848',        // 빨강 (어린 시절)
        sky: '#4870C4',           // 파랑 (어린 시절)
      },
      fontFamily: {
        // 한국어: Pretendard. 영문: 시스템 기본
        display: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
