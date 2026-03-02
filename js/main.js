const copyBtn = document.getElementById('copyCashTag');
copyBtn?.addEventListener('click', async () => {
  const text = document.getElementById('cashTag')?.textContent?.trim() || '$tcburnett';
  const status = document.getElementById('copyStatus');
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = 'Copied Cash App tag.';
  } catch {
    if (status) status.textContent = 'Copy is not available in this browser.';
  }
});
