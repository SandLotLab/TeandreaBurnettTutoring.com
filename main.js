document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));

const copyBtn = document.getElementById('copyCashTag');
copyBtn?.addEventListener('click', async () => {
  const text = document.getElementById('cashTag')?.textContent?.trim() || '$tcburnett';
  const status = document.getElementById('copyStatus');
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = 'Copied!';
  } catch {
    if (status) status.textContent = 'Copy not supported on this browser.';
  }
});
