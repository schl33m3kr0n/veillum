export function isFullscreen() {
  return document.fullscreenElement != null;
}

export async function toggleFullscreen(target?: HTMLElement | null) {
  try {
    if (isFullscreen()) {
      await document.exitFullscreen();
      return;
    }
    const el = target ?? document.documentElement;
    await el.requestFullscreen();
  } catch (err) {
    console.error("Fullscreen was blocked", err);
  }
}
