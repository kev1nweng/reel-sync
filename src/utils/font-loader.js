/**
 * 延迟加载 Google Sans Flex 字体
 * 使用动态加载避免阻塞页面渲染
 */

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wdth,wght,ROND@6..144,25..150,1..1000,0..100&display=swap";

let fontLoaded = false;
let fontLoadPromise = null;

/**
 * 预连接到 Google Fonts 服务器
 */
function preconnectFonts() {
  const preconnects = [
    { href: "https://fonts.googleapis.com", crossOrigin: false },
    { href: "https://fonts.gstatic.com", crossOrigin: true },
  ];

  preconnects.forEach(({ href, crossOrigin }) => {
    if (!document.querySelector(`link[href="${href}"][rel="preconnect"]`)) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      if (crossOrigin) link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
  });
}

/**
 * 动态加载字体样式表
 */
function loadFontStylesheet() {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${FONT_URL}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    link.media = "print"; // 初始设置为 print，避免阻塞渲染
    link.onload = () => {
      link.media = "all"; // 加载完成后切换为 all
      resolve();
    };
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/**
 * 等待字体实际加载完成
 */
async function waitForFontReady() {
  if (!("fonts" in document)) {
    // 浏览器不支持 Font Loading API，等待一段时间
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  try {
    await document.fonts.ready;
    // 检查字体是否可用
    const fontCheck = await document.fonts.load('16px "Google Sans Flex"');
    return fontCheck.length > 0;
  } catch {
    return false;
  }
}

/**
 * 应用字体到页面
 */
function applyFont() {
  document.documentElement.classList.add("font-loaded");
}

/**
 * 初始化并加载字体
 * @returns {Promise<boolean>} 字体是否加载成功
 */
export async function loadGoogleSansFont() {
  if (fontLoaded) return true;

  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    try {
      // 1. 预连接
      preconnectFonts();

      // 2. 使用 requestIdleCallback 或 setTimeout 延迟加载
      await new Promise((resolve) => {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(resolve, { timeout: 2000 });
        } else {
          setTimeout(resolve, 100);
        }
      });

      // 3. 加载字体样式表
      await loadFontStylesheet();

      // 4. 等待字体就绪
      await waitForFontReady();

      // 5. 应用字体类
      applyFont();

      fontLoaded = true;
      return true;
    } catch (error) {
      console.warn("Font loading failed:", error);
      return false;
    }
  })();

  return fontLoadPromise;
}

/**
 * 检查字体是否已加载
 */
export function isFontLoaded() {
  return fontLoaded;
}

export default loadGoogleSansFont;
