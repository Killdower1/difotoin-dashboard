param()

# === SANITIZE SOURCE to UTF-8 + fix mojibake ===
$exts  = "*.ts","*.tsx","*.js","*.jsx","*.md","*.json"
$files = Get-ChildItem -Recurse -Include $exts -File

# Peta pengganti (termasuk pola double-encoded)
$map = [ordered]@{
  "Ã¢â‚¬â€œ"="–";  "Ã¢â‚¬â€�"="—";  "Ã¢â‚¬Ëœ"="‘";  "Ã¢â‚¬â„¢"="’";
  "Ã¢â‚¬Å“"="“";  "Ã¢â‚¬Â"="”";  "Ã¢â€žÂ¢"="™";  "Ã¢â€šÂ¬"="€";
  "Ã‚Â"="";      "Â"="";       "â€“"="–";     "â€”"="—";
  "â€˜"="‘";     "â€™"="’";     "â€œ"="“";     "â€"="”";
  # variasi double-encode yg sering muncul:
  "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢"="’";  "ÃƒÂ¢Ã¢â€šÂ¬"="—";   "ÃƒÂ¢"="";  "Ãƒ"="";
}

function Decode-Text([byte[]]$bytes) {
  if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    return [Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length-2)      # UTF-16 LE (BOM)
  } elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
    return [Text.Encoding]::BigEndianUnicode.GetString($bytes, 2, $bytes.Length-2) # UTF-16 BE (BOM)
  } else {
    return [Text.Encoding]::UTF8.GetString($bytes)  # assume UTF-8
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$changed = 0
foreach ($f in $files) {
  $raw   = [IO.File]::ReadAllBytes($f.FullName)
  $text  = Decode-Text $raw
  $before = $text
  foreach ($k in $map.Keys) { $text = $text.Replace($k, $map[$k]) }
  $hadUtf16 = ($raw.Length -ge 2 -and (($raw[0]-eq0xFF -and $raw[1]-eq0xFE) -or ($raw[0]-eq0xFE -and $raw[1]-eq0xFF)))
  if ($text -ne $before -or $hadUtf16) {
    [IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
    $changed++
  }
}
Write-Host ("Sanitized files: {0} / {1}" -f $changed, $files.Count)

# Pastikan <meta charSet="utf-8" /> ada di app/layout.tsx
$layout = "app\layout.tsx"
if (Test-Path $layout) {
  $ltxt = Get-Content $layout -Raw
  if ($ltxt -notmatch 'charSet="utf-8"') {
    $ltxt = $ltxt -replace '(<head>\s*)', '$1<meta charSet="utf-8" />'
    [IO.File]::WriteAllText($layout, $ltxt, $utf8NoBom)
    Write-Host "Injected <meta charSet> to app\layout.tsx"
  }
}

# Info: masih ada 'Ã'?
if (Select-String -Path $exts -Recurse -Pattern 'Ã' -Quiet) {
  Write-Host '⚠️  Masih ada "Ã" di sebagian source. Setelah build, beri tahu bagian tepatnya untuk patch spesifik.'
}
