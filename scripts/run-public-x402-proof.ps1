param(
  [string]$PublicDemoUrl = "https://stuff-angle-cap-obituaries.trycloudflare.com"
)

$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $PSScriptRoot
$secretPtr = [IntPtr]::Zero
$plainKey = $null

try {
  $demoUri = [Uri]$PublicDemoUrl
  if ($demoUri.Scheme -ne "https" -or -not $demoUri.Host) {
    throw "Public demo URL must be a valid HTTPS URL."
  }

  $resourceUrl = "{0}://{1}/api/paid-report" -f $demoUri.Scheme, $demoUri.Authority
  Write-Host "Public x402 proof will send 0.01 Fuji TEST USDC."
  Write-Host "Resource: $resourceUrl"
  Write-Host "The private key is hidden and is not written to a file or log."

  $secureKey = Read-Host "Enter the funded Fuji test wallet private key" -AsSecureString
  $secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)
  if ($plainKey -match '^[0-9a-fA-F]{64}$') { $plainKey = "0x$plainKey" }
  if ($plainKey -notmatch '^0x[0-9a-fA-F]{64}$') {
    throw "Private key must be a 32-byte hexadecimal value."
  }

  $env:X402_CLIENT_PRIVATE_KEY = $plainKey
  $env:X402_EXPECTED_PAYER = "0x65e257B601b9545a6575801B967C527B35E2720d"
  $env:X402_PAY_TO_ADDRESS = "0x9a2b5BdFd3CA23456957882695Bbf81510430853"
  $env:X402_RESOURCE_URL = $resourceUrl

  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $tsxCli = Join-Path $workspace "node_modules\tsx\dist\cli.mjs"
  if (-not (Test-Path -LiteralPath $tsxCli)) {
    throw "tsx was not found. Run pnpm install --frozen-lockfile first."
  }

  Push-Location $workspace
  try {
    & $node $tsxCli "apps/agent-client/src/pay.ts"
    if ($LASTEXITCODE -ne 0) {
      throw "Public x402 client exit code: $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
} finally {
  $env:X402_CLIENT_PRIVATE_KEY = $null
  $env:X402_EXPECTED_PAYER = $null
  $env:X402_PAY_TO_ADDRESS = $null
  $env:X402_RESOURCE_URL = $null
  $plainKey = $null
  if ($secretPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
  }
}
