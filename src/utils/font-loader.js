/**
 * 延迟加载 Google Sans Flex 字体和 Material Icons
 * 使用动态加载避免阻塞页面渲染
 */

const FONT_DOMAIN_GOOGLE = "https://fonts.googleapis.com";
const FONT_DOMAIN_MIRROR = "https://gfonts.aby.pub";

const FONT_PATH_CSS =
  "/css2?family=Google+Sans+Flex:opsz,wdth,wght,ROND@6..144,25..150,1..1000,0..100&display=swap";
const FONT_PATH_ICONS = "/icon?family=Material+Icons+Round";

let fontLoaded = false;
let fontLoadPromise = null;
let selectedDomain = FONT_DOMAIN_GOOGLE;

/**
 * 检测 Google Fonts 是否可用
 * @returns {Promise<boolean>}
 */
async function checkGoogleFonts() {
  // 如果 localStorage 中已经保存了优选结果，直接返回
  const cachedDomain = localStorage.getItem("preferred-font-domain");
  if (cachedDomain) {
    selectedDomain = cachedDomain;
    return cachedDomain === FONT_DOMAIN_GOOGLE;
  }

  // 如果浏览器语言不是中文，默认优先使用 Google
  if (!navigator.language.startsWith("zh")) {
    return true;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500); // 1.5s 超时

    // 尝试访问 Google Fonts 的一个小资源
    await fetch(`${FONT_DOMAIN_GOOGLE}/icon?family=Material+Icons+Round`, {
      mode: "no-cors",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    localStorage.setItem("preferred-font-domain", FONT_DOMAIN_GOOGLE);
    return true;
  } catch {
    selectedDomain = FONT_DOMAIN_MIRROR;
    localStorage.setItem("preferred-font-domain", FONT_DOMAIN_MIRROR);
    return false;
  }
}

/**
 * 预连接到字体服务器
 */
function preconnectFonts() {
  const preconnects = [
    { href: selectedDomain, crossOrigin: false },
  ];

  if (selectedDomain === FONT_DOMAIN_GOOGLE) {
    preconnects.push({ href: "https://fonts.gstatic.com", crossOrigin: true });
  }

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
 * 动态加载样式表
 * @param {string} url
 */
function loadStylesheet(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${url}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
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
 * 动态加载字体样式表
 */
async function loadFontStylesheets() {
  const cssUrl = selectedDomain + FONT_PATH_CSS;
  const iconUrl = selectedDomain + FONT_PATH_ICONS;

  await Promise.all([loadStylesheet(cssUrl), loadStylesheet(iconUrl)]);
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
    const iconCheck = await document.fonts.load('16px "Material Icons Round"');
    return fontCheck.length > 0 && iconCheck.length > 0;
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
      // 0. 自动优选域名
      await checkGoogleFonts();

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

      // 3. 加载字体样式表 (包含 Google Sans 和 Material Icons)
      await loadFontStylesheets();

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
