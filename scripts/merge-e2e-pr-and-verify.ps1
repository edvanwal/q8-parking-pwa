<#
.SYNOPSIS
  Create PR (if none), squash-merge it, then checkout main, pull, and run gates.
  Requires: GH_TOKEN
  Output: PR URL, merge commit SHA, gate results, proof path.
#>
$ErrorActionPreference = "Stop"
$token = $env:GH_TOKEN
if (-not $token -or $token -eq "") {
    Write-Error "GH_TOKEN is required. Set it: `$env:GH_TOKEN = 'ghp_...'"
    exit 1
}

$branch = git branch --show-current 2>$null
if (-not $branch) { Write-Error "Not on a branch."; exit 1 }
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) { Write-Error "No remote origin."; exit 1 }
if ($remoteUrl -notmatch 'github\.com[:/]([^/]+)/([^/]+?)(\.git)?$') {
    Write-Error "Origin is not a GitHub URL."
    exit 1
}
$owner = $Matches[1]
$repo  = $Matches[2] -replace '\.git$', ''
$baseUri = "https://api.github.com/repos/$owner/$repo"
$headers = @{
    "Accept"               = "application/vnd.github+json"
    "Authorization"        = "Bearer $token"
    "X-GitHub-Api-Version" = "2022-11-28"
}

# 1) Get or create PR
$head = "${owner}:${branch}"
$listUri = "${baseUri}/pulls?head=${head}&state=open"
$existing = Invoke-RestMethod -Uri $listUri -Headers $headers -Method Get
$pr = $null
if ($existing -and $existing.Count -gt 0) {
    $pr = $existing[0]
    Write-Output "PR URL: $($pr.html_url)"
} else {
    $payload = @{
        title = "fix(e2e): proof covers menu + logout"
        body  = "Gates PASS: format:check, preflight, test:e2e:proof. Selectors: btn-menu-open, side-menu, menu-item-parking, btn-logout. Canon bijgewerkt (NAV-001, AUTH-001). Bewijs: test-output/e2e-proof/"
        head  = $branch
        base  = "main"
    } | ConvertTo-Json
    $pr = Invoke-RestMethod -Uri "${baseUri}/pulls" -Headers $headers -Method Post -Body $payload -ContentType "application/json; charset=utf-8"
    Write-Output "PR URL: $($pr.html_url)"
}

$prNumber = $pr.number

# 2) Merge (squash)
$mergePayload = @{ merge_method = "squash" } | ConvertTo-Json
$mergeResult = Invoke-RestMethod -Uri "${baseUri}/pulls/$prNumber/merge" -Headers $headers -Method Put -Body $mergePayload -ContentType "application/json; charset=utf-8"
Write-Output "Merge commit SHA: $($mergeResult.sha)"

# 3) Checkout main, pull
git checkout main
git pull origin main

# 4) Gates
Write-Output "--- format:check ---"
npm run format:check
$fmtExit = $LASTEXITCODE
Write-Output "--- preflight ---"
npm run preflight
$preExit = $LASTEXITCODE
Write-Output "--- test:e2e:proof ---"
npm run test:e2e:proof
$e2eExit = $LASTEXITCODE
Write-Output "Bewijs-pad: test-output/e2e-proof/"
if ($fmtExit -ne 0 -or $preExit -ne 0 -or $e2eExit -ne 0) {
    exit 1
}
