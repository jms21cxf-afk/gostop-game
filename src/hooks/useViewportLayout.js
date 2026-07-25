import { useLayoutEffect, useEffect } from 'react';

/** visualViewport + PWA/브라우저 구분 — 크롬 하단 주소창·손패 잘림 보정 */
function syncMode() {
  const root = document.documentElement;
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  root.classList.toggle('mode-standalone', standalone);
  root.classList.toggle('mode-browser', !standalone);
}

function syncViewport() {
  const root = document.documentElement;
  const vv = window.visualViewport;
  let height;
  if (vv && vv.height > 0) {
    height = vv.height;
  } else {
    height = Math.max(window.innerHeight, 320);
  }
  root.style.setProperty('--app-height', `${height}px`);

  if (vv) {
    const bottomInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    root.style.setProperty('--vv-bottom', `${bottomInset}px`);
  } else {
    root.style.setProperty('--vv-bottom', '0px');
  }
}

export function useViewportLayout() {
  useLayoutEffect(() => {
    syncMode();
    syncViewport();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', syncMode);
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);

    return () => {
      mq.removeEventListener('change', syncMode);
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
    };
  }, []);
}
