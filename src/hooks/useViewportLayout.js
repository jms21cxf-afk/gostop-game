import { useEffect, useLayoutEffect } from 'react';

/** visualViewport + PWA/브라우저 구분 — 크롬 하단 주소창·손패 잘림 보정 */
export function useViewportLayout() {
  useLayoutEffect(() => {
    const root = document.documentElement;

    const syncMode = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      root.classList.toggle('mode-standalone', standalone);
      root.classList.toggle('mode-browser', !standalone);
    };

    const syncViewport = () => {
      const vv = window.visualViewport;
      if (vv) {
        root.style.setProperty('--app-height', `${vv.height}px`);
        const bottomInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty('--vv-bottom', `${bottomInset}px`);
      } else {
        root.style.setProperty('--app-height', `${window.innerHeight}px`);
        root.style.setProperty('--vv-bottom', '0px');
      }
    };

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
