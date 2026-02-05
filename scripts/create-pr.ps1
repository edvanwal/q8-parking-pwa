<#
.SYNOPSIS
  Create a GitHub PR for the current branch using GH_TOKEN (or print existing PR URL).
.DESCRIPTION
  Reads current branch and repo from git. If an open PR already exists for this branch,
  prints its URL and exits. Otherwise creates a PR via GitHub REST API.
  Requires GH_TOKEN environment variable.
.EXAMPLE
  .\scripts\create-pr.ps1
.EXAMPLE
  .\scripts\create-pr.ps1 -Title "fix: something" -Body "Details here" -Base main
#>
[CmdletBinding()]
param(
    [string]$Title,
    [string]$Body,
    [string]$Base = "main"
)

$ErrorActionPreference = "Stop"

# --- Require GH_TOKEN ---
$token = $env:GH_TOKEN
if (-not $token -or $token -eq "") {
    Write-Error "GH_TOKEN is required. Set it (e.g. `$env:GH_TOKEN = 'ghp_...') or pass a token. See: https://github.com/settings/tokens"
    exit 1
}

# --- Current branch ---
$branch = git branch --show-current 2>$null
if (-not $branch) {
    Write-Error "Could not get current branch (not in a git repo or detached HEAD?)."
    exit 1
}

# --- Repo owner/name from remote origin ---
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
    Write-Error "No git remote 'origin' found."
    exit 1
}
# HTTPS: https://github.com/owner/repo or .git
# SSH:   git@github.com:owner/repo.git
if ($remoteUrl -match 'github\.com[:/]([^/]+)/([^/]+?)(\.git)?$') {
    $owner = $Matches[1]
    $repo  = $Matches[2] -replace '\.git$', ''
} else {
    Write-Error "Could not parse GitHub owner/repo from origin: $remoteUrl"
    exit 1
}

$headers = @{
    "Accept"        = "application/vnd.github+json"
    "Authorization" = "Bearer $token"
    "X-GitHub-Api-Version" = "2022-11-28"
}
$baseUri = "https://api.github.com/repos/$owner/$repo"

# --- Check for existing open PR for this branch ---
$head = "${owner}:${branch}"
$listUri = "${baseUri}/pulls?head=${head}&state=open"
try {
    $existing = Invoke-RestMethod -Uri $listUri -Headers $headers -Method Get
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Error "GH_TOKEN invalid or expired. Check https://github.com/settings/tokens"
        exit 1
    }
    throw
}

if ($existing -and $existing.Count -gt 0) {
    $url = $existing[0].html_url
    Write-Output "PR URL: $url"
    exit 0
}

# --- Build title and body if not provided ---
if (-not $Title -or $Title -eq "") {
    $Title = git log -1 --pretty=format:"%s" 2>$null
    if (-not $Title) { $Title = $branch }
}
if (-not $Body -or $Body -eq "") {
    $commitList = git log "${Base}..HEAD" --oneline 2>$null
    $Body = "Branch: $branch`n`nCommits:`n`n$commitList"
}

# --- Create PR ---
$payload = @{
    title = $Title
    body  = $Body
    head  = $branch
    base  = $Base
} | ConvertTo-Json

try {
    $pr = Invoke-RestMethod -Uri "${baseUri}/pulls" -Headers $headers -Method Post -Body $payload -ContentType "application/json; charset=utf-8"
    Write-Output "PR URL: $($pr.html_url)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 422) {
        Write-Error "Create PR failed (422). Check that branch '$branch' is pushed and base '$Base' exists."
        exit 1
    }
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Error "GH_TOKEN invalid or expired."
        exit 1
    }
    throw
}
