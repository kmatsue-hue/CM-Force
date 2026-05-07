const questStyles = `
        @import url('https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        :root { color-scheme: dark; }
        .fc-shell {
          --fc-blue-0: #03081f;
          --fc-blue-1: #0b1a72;
          --fc-blue-2: #10238f;
          --fc-blue-3: #2338bf;
          --fc-text: #f8faff;
          --fc-accent: #f6dc4f;
          --fc-border: #ffffff;
          --fc-shadow: #000000;
          background: var(--fc-blue-0);
        }
        .fc-shell,
        .fc-shell * {
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        .font-dq {
          font-family: 'BIZ UDPGothic', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Meiryo', sans-serif;
          line-height: 1.65;
          letter-spacing: 0.01em;
        }
        .font-dq-title { font-family: 'Press Start 2P', 'DotGothic16', monospace; line-height: 1.15; letter-spacing: 0.03em; }
        .dq-logo {
          display: inline-block;
          color: #f6dc4f;
          font-weight: 700;
          font-family: 'Press Start 2P', 'DotGothic16', monospace;
          letter-spacing: 0.02em;
          transform: none;
        }
        .dq-title-shadow { 
          text-shadow:
            -2px 0 0 #000, 2px 0 0 #000, 0 -2px 0 #000, 0 2px 0 #000,
            -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
            0 4px 0 #11207a;
        }
        .fc-frame {
          background: var(--fc-blue-1);
          border: 4px solid var(--fc-border);
          box-shadow: 0 0 0 4px var(--fc-blue-1), 0 0 0 8px var(--fc-border), 8px 8px 0 var(--fc-shadow);
        }
        .fc-header {
          background: var(--fc-blue-1);
          border-bottom: 3px solid var(--fc-border);
        }
        .fc-main {
          position: relative;
          background: repeating-linear-gradient(0deg, #0b1a72 0px, #0b1a72 6px, #10238f 6px, #10238f 12px);
          overflow-x: hidden;
          overflow-y: auto;
        }
        .fc-main::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj4KICA8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzFmNGVhOCIvPgogIDxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjMiIGZpbGw9IiMyZjY5Y2YiLz4KICA8cmVjdCB4PSIwIiB5PSIzNCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIzIiBmaWxsPSIjMmY2OWNmIi8+CiAgPHJlY3QgeD0iMCIgeT0iNjYiIHdpZHRoPSIxMjgiIGhlaWdodD0iMyIgZmlsbD0iIzJmNjljZiIvPgogIDxyZWN0IHg9IjAiIHk9IjEwMiIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIzIiBmaWxsPSIjMmY2OWNmIi8+CgogIDxyZWN0IHg9IjgiIHk9IjEyIiB3aWR0aD0iNjgiIGhlaWdodD0iNTIiIGZpbGw9IiMyZDhkM2QiLz4KICA8cmVjdCB4PSIyMCIgeT0iNjAiIHdpZHRoPSI3MiIgaGVpZ2h0PSIzMCIgZmlsbD0iIzJkOGQzZCIvPgogIDxyZWN0IHg9IjgyIiB5PSIyNCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjQ0IiBmaWxsPSIjMmQ4ZDNkIi8+CiAgPHJlY3QgeD0iNzIiIHk9Ijc2IiB3aWR0aD0iNDgiIGhlaWdodD0iMzYiIGZpbGw9IiMyZDhkM2QiLz4KCiAgPHJlY3QgeD0iMTQiIHk9IjE2IiB3aWR0aD0iMTQiIGhlaWdodD0iNSIgZmlsbD0iIzQ5YTg1NyIvPgogIDxyZWN0IHg9IjU2IiB5PSIxOCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjUiIGZpbGw9IiM0OWE4NTciLz4KICA8cmVjdCB4PSIzMCIgeT0iNjQiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1IiBmaWxsPSIjNDlhODU3Ii8+CiAgPHJlY3QgeD0iODYiIHk9IjMwIiB3aWR0aD0iMTYiIGhlaWdodD0iNSIgZmlsbD0iIzQ5YTg1NyIvPgogIDxyZWN0IHg9Ijg4IiB5PSI4MCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjUiIGZpbGw9IiM0OWE4NTciLz4KCiAgPHJlY3QgeD0iMjQiIHk9IjQwIiB3aWR0aD0iNjIiIGhlaWdodD0iOCIgZmlsbD0iI2I4OWI2MiIvPgogIDxyZWN0IHg9IjUyIiB5PSI0MCIgd2lkdGg9IjgiIGhlaWdodD0iNTIiIGZpbGw9IiNiODliNjIiLz4KICA8cmVjdCB4PSIzMCIgeT0iNzIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI4IiBmaWxsPSIjYjg5YjYyIi8+CiAgPHJlY3QgeD0iODgiIHk9IjkyIiB3aWR0aD0iMjIiIGhlaWdodD0iNiIgZmlsbD0iI2I4OWI2MiIvPgoKICA8cmVjdCB4PSIyMCIgeT0iMjYiIHdpZHRoPSIxNCIgaGVpZ2h0PSIzIiBmaWxsPSIjYjkxYzFjIi8+CiAgPHJlY3QgeD0iMjIiIHk9IjI5IiB3aWR0aD0iMTAiIGhlaWdodD0iOCIgZmlsbD0iI2Y4ZmFmYyIvPgogIDxyZWN0IHg9IjI2IiB5PSIzMiIgd2lkdGg9IjIiIGhlaWdodD0iNSIgZmlsbD0iIzMzNDE1NSIvPgogIDxyZWN0IHg9IjM0IiB5PSIzMCIgd2lkdGg9IjQiIGhlaWdodD0iMiIgZmlsbD0iIzE2YTM0YSIvPgogIDxyZWN0IHg9IjM1IiB5PSIyOSIgd2lkdGg9IjIiIGhlaWdodD0iNCIgZmlsbD0iIzE2YTM0YSIvPgoKICA8cmVjdCB4PSI2MCIgeT0iNTIiIHdpZHRoPSIxNCIgaGVpZ2h0PSIzIiBmaWxsPSIjYjkxYzFjIi8+CiAgPHJlY3QgeD0iNjIiIHk9IjU1IiB3aWR0aD0iMTAiIGhlaWdodD0iOCIgZmlsbD0iI2Y4ZmFmYyIvPgogIDxyZWN0IHg9IjY2IiB5PSI1OCIgd2lkdGg9IjIiIGhlaWdodD0iNSIgZmlsbD0iIzMzNDE1NSIvPgogIDxyZWN0IHg9Ijc0IiB5PSI1NiIgd2lkdGg9IjQiIGhlaWdodD0iMiIgZmlsbD0iIzE2YTM0YSIvPgogIDxyZWN0IHg9Ijc1IiB5PSI1NSIgd2lkdGg9IjIiIGhlaWdodD0iNCIgZmlsbD0iIzE2YTM0YSIvPgoKICA8cmVjdCB4PSI5MCIgeT0iMzYiIHdpZHRoPSIxNCIgaGVpZ2h0PSIzIiBmaWxsPSIjYjkxYzFjIi8+CiAgPHJlY3QgeD0iOTIiIHk9IjM5IiB3aWR0aD0iMTAiIGhlaWdodD0iOCIgZmlsbD0iI2Y4ZmFmYyIvPgogIDxyZWN0IHg9Ijk2IiB5PSI0MiIgd2lkdGg9IjIiIGhlaWdodD0iNSIgZmlsbD0iIzMzNDE1NSIvPgogIDxyZWN0IHg9IjEwNCIgeT0iNDAiIHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMxNmEzNGEiLz4KICA8cmVjdCB4PSIxMDUiIHk9IjM5IiB3aWR0aD0iMiIgaGVpZ2h0PSI0IiBmaWxsPSIjMTZhMzRhIi8+CgogIDxyZWN0IHg9Ijg2IiB5PSI4NiIgd2lkdGg9IjE0IiBoZWlnaHQ9IjMiIGZpbGw9IiNiOTFjMWMiLz4KICA8cmVjdCB4PSI4OCIgeT0iODkiIHdpZHRoPSIxMCIgaGVpZ2h0PSI4IiBmaWxsPSIjZjhmYWZjIi8+CiAgPHJlY3QgeD0iOTIiIHk9IjkyIiB3aWR0aD0iMiIgaGVpZ2h0PSI1IiBmaWxsPSIjMzM0MTU1Ii8+CiAgPHJlY3QgeD0iMTAwIiB5PSI5MCIgd2lkdGg9IjQiIGhlaWdodD0iMiIgZmlsbD0iIzE2YTM0YSIvPgogIDxyZWN0IHg9IjEwMSIgeT0iODkiIHdpZHRoPSIyIiBoZWlnaHQ9IjQiIGZpbGw9IiMxNmEzNGEiLz4KPC9zdmc+');
          background-size: 220px 220px;
          background-repeat: repeat;
          background-position: center top;
          image-rendering: pixelated;
          opacity: 0.34;
          pointer-events: none;
          z-index: 0;
        }
        .fc-main > div {
          position: relative;
          z-index: 1;
        }
        .fc-window {
          background: var(--fc-blue-2);
          border: 3px solid var(--fc-border);
          box-shadow: inset 0 0 0 2px #0a1b74, inset 0 0 0 4px var(--fc-border), 4px 4px 0 var(--fc-shadow);
          border-radius: 0 !important;
        }
        .fc-window-title {
          background: var(--fc-blue-2);
          border: 2px solid var(--fc-border);
          line-height: 1.2;
        }
        .fc-command {
          color: var(--fc-text);
        }
        .fc-command:hover,
        .fc-command:focus-visible {
          background: rgba(246, 220, 79, 0.18);
        }
        .fc-command.is-disabled {
          opacity: 0.45;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .fc-command-cursor {
          color: var(--fc-accent);
        }
        .fc-progress {
          width: 100%;
          height: 10px;
          background: #000;
          border: 2px solid var(--fc-border);
          box-shadow: inset 0 0 0 2px #0a1b74;
          position: relative;
          margin-top: 0.5rem;
          overflow: hidden;
        }
        .fc-progress-fill {
          height: 100%;
        }
        .fc-nav {
          background: var(--fc-blue-1);
          border-top: 3px solid var(--fc-border);
        }
        .fc-nav-btn {
          flex: 1 1 0;
          width: auto;
          min-height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
          color: var(--fc-text);
          transition: none;
        }
        .fc-nav-btn:hover {
          border-color: var(--fc-border);
          background: #1a2da8;
        }
        .fc-nav-btn.is-active {
          border-color: var(--fc-border);
          background: var(--fc-blue-3);
          color: var(--fc-accent);
        }
        .fc-nav-caret {
          font-size: 13px;
          line-height: 1;
          opacity: 0;
          margin-bottom: 0.14rem;
        }
        .fc-nav-caret.is-active {
          opacity: 1;
          animation: blink 1s step-end infinite;
        }
        .fc-shell button,
        .fc-shell input,
        .fc-shell select,
        .fc-shell textarea {
          border-radius: 0 !important;
          font-family: 'BIZ UDPGothic', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Meiryo', sans-serif;
        }
        .fc-shell .text-\\[9px\\] { font-size: 10px !important; line-height: 1.45 !important; }
        .fc-shell .text-\\[10px\\] { font-size: 11px !important; line-height: 1.45 !important; }
        .fc-shell .text-\\[11px\\] { font-size: 12px !important; line-height: 1.5 !important; }
        .fc-shell input,
        .fc-shell select,
        .fc-shell textarea {
          background: #0d218b !important;
          color: #fff !important;
          border-color: #fff !important;
          box-shadow: inset 0 0 0 1px #051053;
        }
        .fc-shell .bg-black {
          background-color: #0d218b !important;
        }
        .fc-shell .text-yellow-300,
        .fc-shell .text-yellow-200 {
          color: #f6dc4f !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #061350; border: 1px solid #fff; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fff; border-radius: 0; }
        .nav-safe-area { padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
        @keyframes village-window-blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .village-window { animation: village-window-blink 1.8s steps(2, end) infinite; }
        @keyframes village-cart-run { 0% { left: -14%; } 100% { left: 104%; } }
        .village-cart-run { left: -14%; animation: village-cart-run 9s linear infinite; }
        @keyframes village-car-run { 0% { left: -10%; } 100% { left: 106%; } }
        .village-car-run { left: -10%; animation: village-car-run 10s linear infinite; }
        @keyframes village-car-run-rev { 0% { left: 106%; } 100% { left: -10%; } }
        .village-car-run-rev { left: 106%; animation: village-car-run-rev 10s linear infinite; }
        @keyframes village-service-run { 0% { left: 104%; } 100% { left: -12%; } }
        .village-service-run { left: 104%; animation: village-service-run 12s linear infinite; }
        @keyframes village-walker-run { 0% { left: 104%; } 100% { left: -10%; } }
        .village-walker-run { left: 104%; animation: village-walker-run 12s linear infinite; }
        @keyframes village-boat-run { 0% { left: 9%; } 100% { left: 20%; } }
        .village-boat-run { left: 9%; animation: village-boat-run 14s ease-in-out infinite alternate; }
        @keyframes village-water-shimmer { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        .village-water-shimmer { animation: village-water-shimmer 1.4s steps(2, end) infinite; }
        @keyframes village-smoke-rise { 0% { transform: translateY(0) scale(1); opacity: 0.7; } 100% { transform: translateY(-10px) scale(1.5); opacity: 0; } }
        .village-smoke-rise { animation: village-smoke-rise 2.6s ease-out infinite; }
        @keyframes village-windmill-spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        .village-windmill-spin { animation: village-windmill-spin 5s linear infinite; }
        @keyframes village-cloud-drift { 0% { transform: translateX(0); } 100% { transform: translateX(22px); } }
        .village-cloud-drift { animation: village-cloud-drift 44s linear infinite alternate; }
        @keyframes village-bird-fly {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(30vw) translateY(-4px); }
          55% { transform: translateX(58vw) translateY(2px); }
          100% { transform: translateX(116vw) translateY(-3px); }
        }
        .village-bird-fly { animation: village-bird-fly 26s linear infinite; }
        @keyframes village-reed-sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        .village-reed-sway { transform-origin: bottom center; animation: village-reed-sway 2.8s ease-in-out infinite; }
        @keyframes village-banner-wave {
          0%, 100% { transform: scaleX(1); filter: brightness(1); }
          50% { transform: scaleX(0.86); filter: brightness(1.08); }
        }
        .village-banner-wave { transform-origin: left center; animation: village-banner-wave 1.2s steps(2, end) infinite; }
        @keyframes village-signal-blink { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
        .village-signal-blink { animation: village-signal-blink 0.9s steps(2, end) infinite; }
        @keyframes village-crane-swing {
          0%, 100% { transform: rotate(-3deg); transform-origin: left center; }
          50% { transform: rotate(3deg); transform-origin: left center; }
        }
        .village-crane-swing { animation: village-crane-swing 3.6s ease-in-out infinite; }
        @keyframes village-airship-fly { 0% { left: -22%; top: 12%; } 45% { left: 40%; top: 7%; } 100% { left: 108%; top: 12%; } }
        .village-airship-run { left: -22%; top: 12%; animation: village-airship-fly 18s linear infinite; }
        @keyframes village-prop-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .village-prop-spin { animation: village-prop-spin 0.7s linear infinite; }
        .kairo-zoom-backdrop {
          background: #6aa9dc;
        }
        .kairo-city-focus-layer {
          background: #6aa9dc;
        }
        .kairo-city-map {
          image-rendering: pixelated;
          background: #7ac1ee;
        }
        .kairo-day-cycle-haze {
          background:
            radial-gradient(ellipse at 46% 32%, rgba(255, 200, 124, 0.28) 0%, rgba(255, 200, 124, 0) 52%),
            linear-gradient(180deg, rgba(251, 146, 60, 0.18) 0%, rgba(251, 146, 60, 0) 56%);
        }
        .kairo-day-cycle-night {
          background: linear-gradient(180deg, rgba(7, 24, 58, 0.64) 0%, rgba(9, 26, 48, 0.52) 44%, rgba(8, 20, 40, 0.36) 100%);
        }
        .kairo-city-sky {
          background: linear-gradient(180deg, #9bd9ff 0%, #80c9f6 40%, #6eb5e4 62%, transparent 100%);
        }
        .kairo-city-color-grade {
          background:
            radial-gradient(ellipse at 52% 58%, rgba(255, 243, 205, 0.11) 0%, rgba(255, 243, 205, 0) 56%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(10, 35, 68, 0.08) 100%);
          mix-blend-mode: soft-light;
          opacity: 0.7;
        }
        .kairo-city-ground {
          background: linear-gradient(180deg, #83c564 0%, #6fb357 45%, #5c9b47 100%);
        }
        .kairo-foothill-fade {
          background: linear-gradient(180deg, rgba(128, 167, 105, 0.54) 0%, rgba(92, 132, 83, 0.84) 100%);
          clip-path: polygon(0% 100%, 5% 72%, 12% 83%, 20% 64%, 29% 79%, 39% 57%, 47% 79%, 57% 60%, 67% 78%, 76% 59%, 85% 79%, 93% 67%, 100% 76%, 100% 100%);
          opacity: 0.9;
        }
        .kairo-farmland-grid {
          background:
            repeating-linear-gradient(0deg, rgba(54, 96, 49, 0.2) 0px, rgba(54, 96, 49, 0.2) 1px, transparent 1px, transparent 9px),
            repeating-linear-gradient(90deg, rgba(35, 74, 36, 0.16) 0px, rgba(35, 74, 36, 0.16) 1px, transparent 1px, transparent 11px);
          opacity: 0.6;
        }
        .kairo-terrain-relief {
          background:
            radial-gradient(ellipse at 18% 72%, rgba(111, 179, 87, 0.52) 0%, rgba(111, 179, 87, 0) 56%),
            radial-gradient(ellipse at 52% 58%, rgba(94, 155, 71, 0.34) 0%, rgba(94, 155, 71, 0) 62%),
            radial-gradient(ellipse at 84% 66%, rgba(95, 156, 73, 0.42) 0%, rgba(95, 156, 73, 0) 58%);
        }
        .kairo-terrain-texture {
          background:
            repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.09) 0px, rgba(255, 255, 255, 0.09) 1px, transparent 1px, transparent 6px),
            repeating-linear-gradient(60deg, rgba(50, 90, 40, 0.15) 0px, rgba(50, 90, 40, 0.15) 1px, transparent 1px, transparent 7px),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%);
          opacity: 0.55;
        }
        .kairo-horizon-haze {
          background: linear-gradient(180deg, rgba(210, 232, 243, 0.34) 0%, rgba(210, 232, 243, 0) 100%);
        }
        .kairo-riverbank-west,
        .kairo-riverbank-east {
          border: 1px solid rgba(38, 64, 32, 0.45);
          background:
            repeating-linear-gradient(180deg, rgba(166, 140, 92, 0.32) 0px, rgba(166, 140, 92, 0.32) 2px, rgba(108, 146, 79, 0.15) 2px, rgba(108, 146, 79, 0.15) 5px),
            linear-gradient(180deg, #8a7248 0%, #6f8f4f 52%, #5d7f44 100%);
        }
        .kairo-city-river {
          border: 1px solid rgba(231, 244, 255, 0.5);
          box-shadow:
            inset 0 0 0 1px rgba(17, 44, 76, 0.32),
            inset 0 8px 14px rgba(255, 255, 255, 0.16),
            inset 0 -10px 16px rgba(7, 34, 67, 0.35);
          background: linear-gradient(180deg, #5da9e8 0%, #3f86cb 52%, #2b5f96 100%);
          clip-path: polygon(16% 0%, 88% 0%, 100% 10%, 94% 28%, 82% 46%, 91% 67%, 70% 100%, 20% 100%, 0% 83%, 6% 62%, 0% 42%, 8% 19%);
          overflow: hidden;
        }
        .kairo-river-depth {
          background:
            radial-gradient(ellipse at 22% 14%, rgba(171, 223, 255, 0.24) 0%, rgba(171, 223, 255, 0) 48%),
            radial-gradient(ellipse at 64% 70%, rgba(21, 76, 128, 0.42) 0%, rgba(21, 76, 128, 0) 52%),
            radial-gradient(ellipse at 84% 38%, rgba(168, 218, 252, 0.18) 0%, rgba(168, 218, 252, 0) 45%);
        }
        @keyframes kairo-river-flow {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: 0 36px, 0 22px, 0 14px; }
        }
        .kairo-river-current {
          background:
            repeating-linear-gradient(180deg, rgba(223, 242, 255, 0.24) 0px, rgba(223, 242, 255, 0.24) 1px, transparent 1px, transparent 5px),
            repeating-linear-gradient(180deg, rgba(26, 79, 132, 0.2) 0px, rgba(26, 79, 132, 0.2) 2px, transparent 2px, transparent 8px),
            linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(7, 47, 90, 0.1) 100%);
          mix-blend-mode: screen;
          animation: kairo-river-flow 3.2s linear infinite;
        }
        @keyframes kairo-river-glint {
          0%, 100% { opacity: 0.18; transform: translateY(0); }
          50% { opacity: 0.46; transform: translateY(1px); }
        }
        .kairo-river-sparkle {
          background:
            radial-gradient(circle at 26% 23%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 12%),
            radial-gradient(circle at 60% 42%, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0) 10%),
            radial-gradient(circle at 72% 76%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 11%);
          animation: kairo-river-glint 2.4s ease-in-out infinite;
        }
        @keyframes kairo-river-caustics-drift {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 0 28px, 0 18px; }
        }
        .kairo-river-caustics {
          background:
            repeating-linear-gradient(180deg, rgba(186, 230, 253, 0.22) 0px, rgba(186, 230, 253, 0.22) 1px, transparent 1px, transparent 6px),
            repeating-linear-gradient(180deg, rgba(125, 211, 252, 0.16) 0px, rgba(125, 211, 252, 0.16) 1px, transparent 1px, transparent 9px);
          mix-blend-mode: screen;
          animation: kairo-river-caustics-drift 2.8s linear infinite;
          opacity: 0.5;
        }
        @keyframes kairo-river-caustics-line-shift {
          0% { transform: translateX(-2px); opacity: 0.26; }
          100% { transform: translateX(2px); opacity: 0.48; }
        }
        .kairo-river-caustics-line {
          background: linear-gradient(90deg, transparent 0%, rgba(224, 242, 254, 0.68) 30%, rgba(224, 242, 254, 0.2) 100%);
          animation: kairo-river-caustics-line-shift 1.8s ease-in-out infinite alternate;
        }
        @keyframes kairo-river-foam-shift {
          0% { transform: translateX(0); opacity: 0.65; }
          100% { transform: translateX(6px); opacity: 0.35; }
        }
        .kairo-river-foam {
          background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.82) 0px, rgba(255, 255, 255, 0.82) 4px, transparent 4px, transparent 8px);
          animation: kairo-river-foam-shift 2.6s linear infinite alternate;
        }
        .kairo-canal {
          border-left: 1px solid rgba(233, 244, 255, 0.64);
          border-right: 1px solid rgba(233, 244, 255, 0.52);
          background: linear-gradient(180deg, rgba(183, 210, 233, 0.5) 0%, rgba(151, 187, 216, 0.38) 100%);
        }
        .kairo-canal-inner {
          background:
            repeating-linear-gradient(180deg, rgba(219, 234, 254, 0.4) 0px, rgba(219, 234, 254, 0.4) 2px, transparent 2px, transparent 6px),
            linear-gradient(180deg, #71b0e3 0%, #4f8ec8 58%, #356ca2 100%);
        }
        .kairo-city-road {
          border-top: 1px solid rgba(0, 0, 0, 0.55);
          border-bottom: 1px solid rgba(0, 0, 0, 0.55);
          background: linear-gradient(180deg, #6b7280 0%, #3f4752 100%);
        }
        .kairo-city-road-vert {
          border-left: 1px solid rgba(0, 0, 0, 0.55);
          border-right: 1px solid rgba(0, 0, 0, 0.55);
          background: linear-gradient(90deg, #4b5563 0%, #6b7280 50%, #4b5563 100%);
        }
        @keyframes kairo-cloud-drift { 0% { transform: translateX(0); } 100% { transform: translateX(122%); } }
        .kairo-cloud-drift { animation: kairo-cloud-drift 44s linear infinite; }
        .kairo-night-bloom-pass {
          mix-blend-mode: screen;
          filter: blur(0.8px) saturate(1.24) brightness(1.12);
        }
        @keyframes kairo-light-blink { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
        .kairo-light-blink { animation: kairo-light-blink 1s steps(2, end) infinite; }
        @keyframes kairo-pin-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        .kairo-pin-bob { animation: kairo-pin-bob 1.8s steps(2, end) infinite; }
        @keyframes kairo-crane-swing { 0%, 100% { transform: rotate(-3deg); transform-origin: left center; } 50% { transform: rotate(3deg); transform-origin: left center; } }
        .kairo-crane-swing { animation: kairo-crane-swing 3.8s ease-in-out infinite; }
        @keyframes kairo-drive-lr { 0% { left: -12%; } 100% { left: 106%; } }
        .kairo-drive-lr { left: -12%; animation: kairo-drive-lr 9s linear infinite; }
        @keyframes kairo-drive-rl { 0% { left: 106%; } 100% { left: -12%; } }
        .kairo-drive-rl { left: 106%; animation: kairo-drive-rl 9s linear infinite; }
        @keyframes kairo-drive-up { 0% { left: 55%; bottom: 16%; } 100% { left: 55%; bottom: 53%; } }
        .kairo-drive-up { left: 55%; animation: kairo-drive-up 10s linear infinite; }
        @keyframes kairo-walk-lr { 0% { left: -8%; } 100% { left: 105%; } }
        .kairo-walk-lr { left: -8%; animation: kairo-walk-lr 10s linear infinite; }
        @keyframes kairo-walk-rl { 0% { left: 105%; } 100% { left: -8%; } }
        .kairo-walk-rl { left: 105%; animation: kairo-walk-rl 10s linear infinite; }
        @keyframes kairo-monorail-run { 0% { left: -12%; } 100% { left: 108%; } }
        .kairo-monorail-run { left: -12%; animation: kairo-monorail-run 11s linear infinite; }
        @keyframes village-milestone-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        .village-milestone-bob { animation: village-milestone-bob 2.2s steps(2, end) infinite; }
        @keyframes village-milestone-flash { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        .village-milestone-flash { animation: village-milestone-flash 1.1s ease-in-out infinite; }
        @media (max-width: 640px) {
          .fc-frame {
            border-width: 0;
            box-shadow: none;
          }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s step-end infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounce-slow { animation: bounce-slow 1.8s steps(2, end) infinite; }
      `;
export default questStyles;
