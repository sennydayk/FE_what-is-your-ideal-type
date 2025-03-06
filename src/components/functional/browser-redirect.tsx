import { useEffect } from 'react';

const BrowserRedirect: React.FC = () => {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);

    // 클립보드 복사 함수
    const copyToClipboard = async (val: string) => {
      try {
        await navigator.clipboard.writeText(val);
        alert(
          "URL이 복사되었습니다.\nSafari를 열고 주소창을 길게 터치한 뒤 '붙여넣기 및 이동'을 선택하세요.",
        );
      } catch (err) {
        console.error('클립보드 복사 실패', err);
      }
    };

    // Safari에서 직접 열도록 안내 (alert 활용)
    const showSafariRedirectAlert = () => {
      copyToClipboard(currentUrl);
      setTimeout(() => {
        alert(
          "Safari가 자동으로 열리지 않을 경우,\nSafari를 직접 실행한 후\n주소창을 길게 터치하여 '붙여넣기 및 이동'을 눌러주세요.",
        );
      }, 500);
    };

    // 외부 브라우저로 이동
    const redirectToExternalBrowser = () => {
      if (/iphone|ipad|ipod/i.test(userAgent)) {
        showSafariRedirectAlert();
      } else {
        window.location.href = `intent://${currentUrl.replace(
          /^https?:\/\//i,
          '',
        )}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    };

    // 카카오톡
    if (/kakaotalk/i.test(userAgent)) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodedUrl}`;
      return;
    }

    // 라인
    if (/line/i.test(userAgent)) {
      window.location.href = currentUrl.includes('?')
        ? `${currentUrl}&openExternalBrowser=1`
        : `${currentUrl}?openExternalBrowser=1`;
      return;
    }

    // iOS 인앱 브라우저 → Safari 안내
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      showSafariRedirectAlert();
      return;
    }

    // Android 인앱 브라우저 → Chrome 강제 실행
    if (/android/i.test(userAgent)) {
      redirectToExternalBrowser();
      return;
    }
  }, []);

  return null;
};

export default BrowserRedirect;
