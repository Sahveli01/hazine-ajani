$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$processes = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
$secretPtr = [IntPtr]::Zero
$logRoot = Join-Path $env:TEMP "hazine-ajani-demo"
$stateRoot = Join-Path $workspace "work\demo-state"

function Wait-Http([string]$Url, [string]$Name) {
  foreach ($attempt in 1..120) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  throw "$Name hazir olmadi: $Url"
}

function Start-HiddenProcess([string]$File, [string[]]$Arguments, [string]$Name) {
  $out = Join-Path $logRoot "$Name.out.log"
  $err = Join-Path $logRoot "$Name.err.log"
  $process = Start-Process -FilePath $File -ArgumentList $Arguments `
    -WorkingDirectory $workspace -WindowStyle Hidden `
    -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
  $processes.Add($process)
  return $process
}

$analysisRequest = @{
  policy = @{
    policyVersion = "1.0.0"
    maxAllocationRatio = @{ value = "0.25"; scale = 2 }
    minimumLiquidReserveRatio = @{ value = "0.50"; scale = 2 }
    maxRiskNeutralConversionProbability = @{ value = "0.50"; scale = 2 }
    maxStressLossRatio = @{ value = "0.15"; scale = 2 }
    minDataQualityScore = @{ value = "0.50"; scale = 2 }
    minNetEdgeLowerBound = @{ value = "0"; scale = 0 }
    allowedSettlementCurrencies = @("BTC", "USDT")
  }
  portfolio = @{
    totalValue = @{ value = "10000"; currency = "USDT"; scale = 0 }
    liquidValue = @{ value = "9000"; currency = "USDT"; scale = 0 }
    proposedInvestment = @{ value = "1000"; currency = "USDT"; scale = 0 }
  }
  investmentAmount = @{ value = "1000"; currency = "USDT"; scale = 0 }
  optionFeeRate = @{ value = "0.0003"; scale = 4 }
  proxyPolicy = @{
    maxAgeMs = 60000
    minBidSizeContracts = @{ value = "0.01"; scale = 2 }
    minAskSizeContracts = @{ value = "0.01"; scale = 2 }
    maxStrikeDistance = @{ value = "1000"; currency = "USDT"; scale = 0 }
    maxExpiryDistanceMs = 86400000
    minConfidenceScore = @{ value = "0.50"; scale = 2 }
  }
  downsideMove = @{ value = "0.10"; scale = 2 }
  upsideMove = @{ value = "0.10"; scale = 2 }
  outputScale = 8
  executionRequested = $false
} | ConvertTo-Json -Depth 8 -Compress

try {
  New-Item -ItemType Directory -Force -Path $logRoot, $stateRoot | Out-Null
  Get-ChildItem -LiteralPath $logRoot -File -ErrorAction SilentlyContinue | Remove-Item -Force

  $node = (Get-Command node -ErrorAction Stop).Source
  $cloudflaredCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
  $cloudflared = if ($cloudflaredCommand) {
    $cloudflaredCommand.Source
  } else {
    Join-Path $workspace "work\tools\cloudflared.exe"
  }
  if (-not (Test-Path -LiteralPath $cloudflared)) {
    throw "cloudflared bulunamadi. docs/DEPLOYMENT.md kurulum adimini uygula."
  }
  $tsxCli = Join-Path $workspace "node_modules\tsx\dist\cli.mjs"
  $nextCli = Join-Path $workspace "apps\web\node_modules\next\dist\bin\next"
  if (-not (Test-Path -LiteralPath $nextCli)) {
    throw "Next.js giris dosyasi bulunamadi. Once pnpm install --frozen-lockfile calistir."
  }
  $commit = (git -C $workspace rev-parse --short HEAD).Trim()

  Write-Host "Hazine Ajani canli demo baslatiliyor. Veriler OKX TR'den canli okunur."
  Write-Host "Fuji TESTNET facilitator anahtari ekranda veya loglarda gorunmez."
  $secureKey = Read-Host "Fonlanan Fuji test cuzdaninin private key'ini gir" -AsSecureString
  $secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)
  if ($plainKey -match '^[0-9a-fA-F]{64}$') { $plainKey = "0x$plainKey" }
  if ($plainKey -notmatch '^0x[0-9a-fA-F]{64}$') { throw "Private key 32-byte hex olmali." }

  $env:LOCAL_FACILITATOR_PRIVATE_KEY = $plainKey
  $env:PORT = "3002"
  Start-HiddenProcess $node @($tsxCli, "apps/api/src/local-facilitator.ts") "facilitator" | Out-Null
  $env:LOCAL_FACILITATOR_PRIVATE_KEY = $null
  $plainKey = $null
  $env:PORT = $null
  Wait-Http "http://127.0.0.1:3002/health" "Facilitator"

  $env:OKX_READ_PROFILE = "okx-tr-read"
  $env:OKX_SITE = "tr"
  $env:ANALYSIS_REQUEST_JSON = $analysisRequest
  $env:X402_PAY_TO_ADDRESS = "0x9a2b5BdFd3CA23456957882695Bbf81510430853"
  $env:X402_FACILITATOR_URL = "http://127.0.0.1:3002"
  $env:DEPLOY_COMMIT = $commit
  $env:PORT = "3001"
  Start-HiddenProcess $node @($tsxCli, "apps/api/src/index.ts") "api" | Out-Null
  $env:PORT = $null
  Wait-Http "http://127.0.0.1:3001/ready" "API"

  $env:ANALYSIS_API_URL = "http://127.0.0.1:3001/api/analysis"
  $env:X402_REPLAY_STORE_DIR = Join-Path $stateRoot "paid-reports"
  $env:X402_PAY_TO_ADDRESS = "0x9a2b5BdFd3CA23456957882695Bbf81510430853"
  $env:NEXT_PUBLIC_AVALANCHE_NETWORK = "Avalanche Fuji TESTNET"
  $env:NEXT_PUBLIC_DEPLOY_COMMIT = $commit
  Start-HiddenProcess $node @($nextCli, "start", "apps/web", "-p", "3000") "web" | Out-Null
  Wait-Http "http://127.0.0.1:3000" "Web"

  $tunnel = Start-HiddenProcess $cloudflared @("tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:3000") "tunnel"
  $tunnelLog = Join-Path $logRoot "tunnel.err.log"
  $publicUrl = $null
  foreach ($attempt in 1..120) {
    Start-Sleep -Milliseconds 500
    if ($tunnel.HasExited) { break }
    $log = Get-Content -LiteralPath $tunnelLog -Raw -ErrorAction SilentlyContinue
    $match = [regex]::Match($log, 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($match.Success) { $publicUrl = $match.Value; break }
  }
  if (-not $publicUrl) { throw "Cloudflare HTTPS demo adresi alinamadi. $tunnelLog dosyasini kontrol et." }

  Write-Host ""
  Write-Host "CANLI DEMO: $publicUrl" -ForegroundColor Green
  Write-Host "Yerel health: http://127.0.0.1:3001/health"
  Write-Host "Log klasoru: $logRoot"
  Write-Host "Bu pencereyi hackathon boyunca acik tut. Durdurmak icin Ctrl+C."
  while ($true) {
    foreach ($process in $processes) {
      if ($process.HasExited) { throw "Demo sureclerinden biri beklenmedik bicimde kapandi." }
    }
    Start-Sleep -Seconds 5
  }
} finally {
  $env:LOCAL_FACILITATOR_PRIVATE_KEY = $null
  $plainKey = $null
  if ($secretPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
  }
  foreach ($process in $processes) {
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
  }
}
