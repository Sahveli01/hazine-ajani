$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$serverOut = Join-Path $env:TEMP "hazine-a5-api.out.log"
$serverErr = Join-Path $env:TEMP "hazine-a5-api.err.log"
$facilitatorOut = Join-Path $env:TEMP "hazine-a5-facilitator.out.log"
$facilitatorErr = Join-Path $env:TEMP "hazine-a5-facilitator.err.log"
$server = $null
$facilitator = $null
$secretPtr = [IntPtr]::Zero

function Get-FreeTcpPort {
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
  try {
    $listener.Start()
    return ([Net.IPEndPoint]$listener.LocalEndpoint).Port
  } finally {
    $listener.Stop()
  }
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
  Write-Host "A5 Fuji x402 kaniti: 0.01 test USDC odemesi yapilacak."
  $apiPort = Get-FreeTcpPort
  $facilitatorPort = Get-FreeTcpPort
  while ($facilitatorPort -eq $apiPort) { $facilitatorPort = Get-FreeTcpPort }
  $env:X402_EXPECTED_PAYER = "0x65e257B601b9545a6575801B967C527B35E2720d"
  $env:X402_PAY_TO_ADDRESS = "0x9a2b5BdFd3CA23456957882695Bbf81510430853"
  $env:X402_RESOURCE_URL = "http://127.0.0.1:$apiPort/api/agent/risk-report"
  $env:X402_FACILITATOR_URL = "http://127.0.0.1:$facilitatorPort"
  $env:OKX_READ_PROFILE = "okx-tr-read"
  $env:ANALYSIS_REQUEST_JSON = $analysisRequest

  Remove-Item -LiteralPath $serverOut, $serverErr, $facilitatorOut, $facilitatorErr -Force -ErrorAction SilentlyContinue
  $node = (Get-Command node -ErrorAction Stop).Source
  $tsxCli = Join-Path $workspace "node_modules\tsx\dist\cli.mjs"

  Push-Location $workspace
  try {
    pnpm --filter @hazine-ajani/agent-client preflight:fuji
    if ($LASTEXITCODE -ne 0) { throw "Fuji domain preflight exit code: $LASTEXITCODE" }
  } finally {
    Pop-Location
  }

  Write-Host "Private key ekranda gorunmez, dosyaya yazilmaz ve API surecine aktarilmaz."
  $secureKey = Read-Host "Fonlanan test cuzdaninin private key'ini gir" -AsSecureString
  $secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)
  if ($plainKey -match '^[0-9a-fA-F]{64}$') {
    $plainKey = "0x$plainKey"
  }
  if ($plainKey -notmatch '^0x[0-9a-fA-F]{64}$') {
    throw "Private key 32-byte hex olmali."
  }

  $env:LOCAL_FACILITATOR_PRIVATE_KEY = $plainKey
  $env:PORT = "$facilitatorPort"
  $facilitator = Start-Process -FilePath $node `
    -ArgumentList $tsxCli, "apps/api/src/local-facilitator.ts" `
    -WorkingDirectory $workspace `
    -WindowStyle Hidden `
    -RedirectStandardOutput $facilitatorOut `
    -RedirectStandardError $facilitatorErr `
    -PassThru
  $env:LOCAL_FACILITATOR_PRIVATE_KEY = $null
  $env:PORT = $null

  $facilitatorReady = $false
  foreach ($attempt in 1..60) {
    Start-Sleep -Milliseconds 500
    if ($facilitator.HasExited) { break }
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$facilitatorPort/health"
      if ($health.status -eq "ok") { $facilitatorReady = $true; break }
    } catch {}
  }
  if (-not $facilitatorReady) {
    $details = Get-Content -LiteralPath $facilitatorErr -Raw -ErrorAction SilentlyContinue
    throw "Yerel facilitator baslatilamadi. $details"
  }
  Write-Host "Yerel x402 facilitator hazir: gercek Avalanche Fuji settlement."

  $env:PORT = "$apiPort"
  $server = Start-Process -FilePath $node `
    -ArgumentList $tsxCli, "apps/api/src/index.ts" `
    -WorkingDirectory $workspace `
    -WindowStyle Hidden `
    -RedirectStandardOutput $serverOut `
    -RedirectStandardError $serverErr `
    -PassThru
  $env:PORT = $null

  $ready = $false
  foreach ($attempt in 1..120) {
    Start-Sleep -Milliseconds 500
    if ($server.HasExited) { break }
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$apiPort/health"
      if ($health.status -eq "ok") { $ready = $true; break }
    } catch {}
  }
  if (-not $ready) {
    $details = Get-Content -LiteralPath $serverErr -Raw -ErrorAction SilentlyContinue
    throw "API baslatilamadi. $details"
  }

  $analysisReady = $false
  foreach ($attempt in 1..8) {
    try {
      $analysis = Invoke-RestMethod -Uri "http://127.0.0.1:$apiPort/api/analysis"
      if ($analysis.schemaVersion -eq "1.0.0") {
        $analysisReady = $true
        Write-Host "Canli OKX analizi hazir: $($analysis.analysisId)"
        break
      }
    } catch {
      Write-Host "Canli analiz henuz uygun proxy bulamadi; yeniden deneniyor ($attempt/8)."
      Start-Sleep -Seconds 2
    }
  }
  if (-not $analysisReady) {
    throw "Canli analiz hazir olmadigi icin odeme baslatilmadi."
  }

  $env:X402_CLIENT_PRIVATE_KEY = $plainKey

  Push-Location $workspace
  try {
    pnpm --filter @hazine-ajani/agent-client pay:fuji
    if ($LASTEXITCODE -ne 0) {
      $apiDetails = Get-Content -LiteralPath $serverErr -Tail 30 -ErrorAction SilentlyContinue
      if ($apiDetails) {
        throw "x402 client exit code: $LASTEXITCODE`nAPI tanisi:`n$($apiDetails -join "`n")"
      }
      $facilitatorDetails = Get-Content -LiteralPath $facilitatorErr -Tail 30 -ErrorAction SilentlyContinue
      if ($facilitatorDetails) {
        throw "x402 client exit code: $LASTEXITCODE`nFacilitator tanisi:`n$($facilitatorDetails -join "`n")"
      }
      throw "x402 client exit code: $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
} finally {
  $env:X402_CLIENT_PRIVATE_KEY = $null
  $env:LOCAL_FACILITATOR_PRIVATE_KEY = $null
  $env:PORT = $null
  $plainKey = $null
  if ($secretPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
  }
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
  if ($facilitator -and -not $facilitator.HasExited) {
    Stop-Process -Id $facilitator.Id -Force -ErrorAction SilentlyContinue
  }
  Remove-Item -LiteralPath $serverOut, $serverErr, $facilitatorOut, $facilitatorErr -Force -ErrorAction SilentlyContinue
}
