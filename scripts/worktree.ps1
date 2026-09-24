<#
.SYNOPSIS
  Cria e remove worktrees com nome deterministico (ver .cursor/rules/github-issue-branch-pr.mdc).

.EXAMPLE
  ./scripts/worktree.ps1 new-epic  -Issue 120 -Slug overview-customer
  ./scripts/worktree.ps1 new-child -Epic 120 -Issue 123 -Slug observacoes -Type feature
  ./scripts/worktree.ps1 new       -Issue 130 -Slug ajuste-x -Type hotfix
  ./scripts/worktree.ps1 remove    -Issue 123
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('new-epic', 'new-child', 'new', 'remove')]
  [string]$Command,

  [Parameter(Mandatory = $true)]
  [int]$Issue,

  [string]$Slug,

  [int]$Epic,

  [ValidateSet('feature', 'hotfix')]
  [string]$Type = 'feature'
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param([string[]]$GitArgs)
  $output = & git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArgs -join ' ') falhou (exit $LASTEXITCODE)."
  }
  return $output
}

function Get-MainRepoPath {
  $commonDir = Invoke-Git @('rev-parse', '--path-format=absolute', '--git-common-dir')
  return Split-Path -Parent $commonDir
}

function Get-WorktreesRoot {
  $mainRepo = Get-MainRepoPath
  $name = Split-Path -Leaf $mainRepo
  return Join-Path (Split-Path -Parent $mainRepo) "$name.worktrees"
}

function Assert-Slug {
  if (-not $Slug) { throw 'Informe -Slug.' }
  if ($Slug -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
    throw "Slug invalido '$Slug': use kebab-case minusculo, sem acento."
  }
}

function Assert-BranchFree {
  param([string]$Branch)
  & git show-ref --verify --quiet "refs/heads/$Branch"
  if ($LASTEXITCODE -eq 0) { throw "Branch local '$Branch' ja existe." }
  $remote = & git ls-remote --heads origin $Branch
  if ($remote) { throw "Branch remota '$Branch' ja existe." }
}

function Resolve-EpicBranch {
  param([int]$EpicIssue)
  $refs = @(& git ls-remote --heads origin "epic/$EpicIssue-*" | Where-Object { $_ })
  if ($refs.Count -ne 1) {
    throw "Esperava exatamente uma branch origin/epic/$EpicIssue-*, encontrei $($refs.Count)."
  }
  return ($refs[0] -split "`t")[1] -replace '^refs/heads/', ''
}

function New-Worktree {
  param([string]$Branch, [string]$Folder, [string]$Base)
  $root = Get-WorktreesRoot
  $path = Join-Path $root $Folder
  if (Test-Path $path) { throw "Pasta '$path' ja existe." }
  Assert-BranchFree -Branch $Branch
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  Invoke-Git @('worktree', 'add', '--no-track', $path, '-b', $Branch, $Base) | Out-Null
  Write-Host "Worktree: $path"
  Write-Host "Branch:   $Branch (base $Base)"
  return $path
}

function Remove-IssueWorktree {
  $pattern = "^branch refs/heads/(epic|feature|hotfix)/$Issue-"
  $lines = Invoke-Git @('worktree', 'list', '--porcelain')
  $current = $null
  $match = $null
  foreach ($line in $lines) {
    if ($line -like 'worktree *') { $current = $line.Substring(9) }
    elseif ($line -match $pattern) {
      if ($match) { throw "Mais de uma worktree para a issue #$Issue." }
      $match = @{ Path = $current; Branch = $line.Substring(18) }
    }
  }
  if (-not $match) { throw "Nenhuma worktree encontrada para a issue #$Issue." }

  $target = [IO.Path]::GetFullPath($match.Path)
  $here = [IO.Path]::GetFullPath((Get-Location).Path)
  if ($here.StartsWith($target, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Saia de '$target' antes de remove-la."
  }

  Invoke-Git @('worktree', 'remove', $match.Path) | Out-Null
  & git branch -D $match.Branch | Out-Null
  Invoke-Git @('worktree', 'prune') | Out-Null
  Write-Host "Removida: $($match.Path) ($($match.Branch))"
}

switch ($Command) {
  'new-epic' {
    Assert-Slug
    Invoke-Git @('fetch', 'origin') | Out-Null
    $branch = "epic/$Issue-$Slug"
    $path = New-Worktree -Branch $branch -Folder "epic-$Issue-$Slug" -Base 'origin/main'
    Invoke-Git @('-C', $path, 'push', '-u', 'origin', $branch) | Out-Null
    Write-Host "Push:     origin/$branch"
  }
  'new-child' {
    Assert-Slug
    if (-not $Epic) { throw 'Informe -Epic <numero da issue pai>.' }
    Invoke-Git @('fetch', 'origin') | Out-Null
    $epicBranch = Resolve-EpicBranch -EpicIssue $Epic
    $branch = "$Type/$Issue-$Slug"
    New-Worktree -Branch $branch -Folder "epic-$Epic--$Type-$Issue-$Slug" -Base "origin/$epicBranch" | Out-Null
    Write-Host "PR para:  $epicBranch"
  }
  'new' {
    Assert-Slug
    Invoke-Git @('fetch', 'origin') | Out-Null
    $branch = "$Type/$Issue-$Slug"
    New-Worktree -Branch $branch -Folder "$Type-$Issue-$Slug" -Base 'origin/main' | Out-Null
    Write-Host 'PR para:  main'
  }
  'remove' {
    Remove-IssueWorktree
  }
}
