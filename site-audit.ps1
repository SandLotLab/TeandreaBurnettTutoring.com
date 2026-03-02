# ===============================
# TeAndrea Burnett Tutoring - Site + Repo Audit
# ===============================

$domain   = "https://teandreaburnetttutoring.com"
$repoRoot = $PSScriptRoot   # run the script from inside the repo folder

$urls = @(
  "$domain/",
  "$domain/about.html",
  "$domain/contact.html",
  "$domain/schedule.html",
  "$domain/privacy.html",
  "$domain/terms.html",
  "$domain/robots.txt",
  "$domain/sitemap.xml"
)

function Fetch($url) {
  try {
    return Invoke-WebRequest -Uri $url -Method GET -MaximumRedirection 10 -UseBasicParsing -ErrorAction Stop -Headers @{
      "User-Agent" = "Mozilla/5.0"
    }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      try { Write-Host "Status: $([int]$resp.StatusCode)  $url" } catch {}
    } else {
      Write-Host "ERROR: $($_.Exception.Message)  $url"
    }
    return $null
  }
}

function Get-Hrefs($html) {
  if (-not $html) { return @() }
  return [regex]::Matches($html, 'href\s*=\s*["'']([^"'']+)["'']', 'IgnoreCase') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
}

function Get-Srcs($html) {
  if (-not $html) { return @() }
  return [regex]::Matches($html, 'src\s*=\s*["'']([^"'']+)["'']', 'IgnoreCase') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
}

function Resolve-LocalPath($ref) {
  if (-not $ref) { return $null }
  if ($ref -match '^(https?:)?//') { return $null }  # external
  if ($ref -match '^mailto:|^tel:|^#') { return $null }

  $p = $ref.Split('?')[0].Split('#')[0]
  if ($p.StartsWith("/")) { $p = $p.Substring(1) }

  return Join-Path $repoRoot $p
}

Write-Host "`n========== REMOTE CHECK =========="

foreach ($url in $urls) {
  Write-Host "`n===== $url ====="
  $r = Fetch $url
  if (-not $r) { continue }

  Write-Host "Status: $($r.StatusCode)"
  Write-Host "Content-Type: $($r.Headers.'Content-Type')"
  Write-Host "Cache-Control: $($r.Headers.'Cache-Control')"
  Write-Host "CSP: $($r.Headers.'Content-Security-Policy')"
  Write-Host "HSTS: $($r.Headers.'Strict-Transport-Security')"

  if ($url.EndsWith("/")) {
    Write-Host "`n---- First 40 lines of body ----"
    ($r.Content -split "`n" | Select-Object -First 40) -join "`n"
  }
}

Write-Host "`n========== LOCAL REPO CHECK =========="

$indexPath = Join-Path $repoRoot "index.html"
if (!(Test-Path $indexPath)) {
  Write-Host "ERROR: index.html not found at repo root: $indexPath"
  exit 1
}

# Check for missing referenced files from key HTML pages
$pages = @("index.html","about.html","contact.html","schedule.html","privacy.html","terms.html") |
  ForEach-Object { Join-Path $repoRoot $_ } | Where-Object { Test-Path $_ }

$missing = @()

foreach ($page in $pages) {
  $html = Get-Content $page -Raw -ErrorAction SilentlyContinue
  $refs = (Get-Hrefs $html) + (Get-Srcs $html)
  $refs = $refs | Sort-Object -Unique

  foreach ($ref in $refs) {
    $lp = Resolve-LocalPath $ref
    if ($lp -and !(Test-Path $lp)) {
      $missing += [PSCustomObject]@{ page = (Split-Path $page -Leaf); ref = $ref; expected = $lp }
    }
  }
}

if ($missing.Count -gt 0) {
  Write-Host "`nMISSING LOCAL FILES (referenced but not found):"
  $missing | Format-Table -AutoSize
} else {
  Write-Host "`nOK: No missing local files referenced by HTML pages."
}

Write-Host "`n========== SNAPSHOTS =========="

try {
  $backupPath = Join-Path $repoRoot "backups"
  if (!(Test-Path $backupPath)) { New-Item -ItemType Directory -Path $backupPath | Out-Null }

  $homeResp = Fetch "$domain/"
  if ($homeResp) { $homeResp.Content | Out-File -Encoding utf8 (Join-Path $backupPath "audit_home.html") }

  $r1 = Fetch "$domain/robots.txt"
  if ($r1) { $r1.Content | Out-File -Encoding utf8 (Join-Path $backupPath "audit_robots.txt") }

  $r2 = Fetch "$domain/sitemap.xml"
  if ($r2) { $r2.Content | Out-File -Encoding utf8 (Join-Path $backupPath "audit_sitemap.xml") }

  Write-Host "Saved backups\audit_home.html, backups\audit_robots.txt, backups\audit_sitemap.xml"
} catch {
  Write-Host "Snapshot save failed."
}

Write-Host "`n========== DONE =========="