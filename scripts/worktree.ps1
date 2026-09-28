<#
.SYNOPSIS
  Cria e remove worktrees com nome deterministico (ver .cursor/rules/github-issue-branch-pr.mdc).
  Uma epic = uma worktree; filhas sao branches dentro da worktree da epic, uma por vez.

.EXAMPLE
  ./scripts/worktree.ps1 new-epic     -Issue 120 -Slug overview-customer
  ./scripts/worktree.ps1 new-child    -Epic 120 -Issue 123 -Slug observacoes -Type feature
  ./scripts/worktree.ps1 finish-child -Epic 120 -Issue 123   # -Force descarta filha nao mergeada
  ./scripts/worktree.ps1 new          -Issue 130 -Slug ajuste-x -Type hotfix
  ./scripts/worktree.ps1 remove       -Issue 130
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('new-epic', 'new-child', 'finish-child', 'new', 'remove')]
  [string]$Command,

  [Parameter(Mandatory = $true)]
  [int]$Issue,

  [string]$Slug,

  [int]$Epic,

  [ValidateSet('feature', 'hotfix')]
  [string]$Type = 'feature',

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param([string[]]$GitArgs, [switch]$AllowFailure)
  # git escreve progresso no stderr; com 'Stop' o PowerShell 5.1 trataria isso como erro fatal quando o stderr e redirecionado.
  $ErrorActionPreference = 'Continue'
  $output = & git @GitArgs
  if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
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
  return [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $mainRepo) "$name.worktrees"))
}

function Get-WorktreeEntries {
  $entries = @()
  $current = $null
  foreach ($line in (Invoke-Git @('worktree', 'list', '--porcelain'))) {
    if ($line -like 'worktree *') {
      $current = [pscustomobject]@{ Path = [IO.Path]::GetFullPath($line.Substring(9)); Branch = $null }
      $entries += $current
    }
    elseif ($current -and $line -like 'branch refs/heads/*') {
      $current.Branch = $line.Substring(18)
    }
  }
  return $entries
}

function Assert-Slug {
  if (-not $Slug) { throw 'Informe -Slug.' }
  if ($Slug -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
    throw "Slug invalido '$Slug': use kebab-case minusculo, sem acento."
  }
}

function Assert-Epic {
  if (-not $Epic) { throw 'Informe -Epic <numero da issue pai>.' }
}

function Assert-BranchFree {
  param([string]$Branch)
  Invoke-Git @('show-ref', '--verify', '--quiet', "refs/heads/$Branch") -AllowFailure | Out-Null
  if ($LASTEXITCODE -eq 0) { throw "Branch local '$Branch' ja existe." }
  $remote = Invoke-Git @('ls-remote', '--heads', 'origin', $Branch)
  if ($remote) { throw "Branch remota '$Branch' ja existe." }
}

function Assert-CleanWorktree {
  param([string]$Path)
  $dirty = Invoke-Git @('-C', $Path, 'status', '--porcelain')
  if ($dirty) { throw "Worktree '$Path' tem alteracoes nao commitadas. Faca commit ou descarte antes." }
}

function Resolve-EpicBranch {
  param([int]$EpicIssue)
  $refs = @(Invoke-Git @('ls-remote', '--heads', 'origin', "epic/$EpicIssue-*") | Where-Object { $_ })
  if ($refs.Count -ne 1) {
    throw "Esperava exatamente uma branch origin/epic/$EpicIssue-*, encontrei $($refs.Count)."
  }
  return ($refs[0] -split "`t")[1] -replace '^refs/heads/', ''
}

function Get-EpicWorktree {
  param([string]$EpicBranch)
  $path = Join-Path (Get-WorktreesRoot) ($EpicBranch -replace '/', '-')
  $entry = @(Get-WorktreeEntries | Where-Object { $_.Path -ieq $path })
  if ($entry.Count -ne 1) {
    throw "Worktree da epic nao encontrada em '$path'. Filhas sao criadas dentro da worktree da epic (new-epic)."
  }
  return $entry[0]
}

function Get-ChildBranch {
  param([int]$ChildIssue)
  $refs = @(Invoke-Git @('for-each-ref', '--format=%(refname:short)', "refs/heads/feature/$ChildIssue-*", "refs/heads/hotfix/$ChildIssue-*") | Where-Object { $_ })
  if ($refs.Count -ne 1) {
    throw "Esperava exatamente uma branch local feature|hotfix/$ChildIssue-*, encontrei $($refs.Count)."
  }
  return $refs[0]
}

function Assert-ChildMerged {
  param([string]$ChildBranch, [string]$EpicBranch)
  if ($Force) { return }
  # Merge squash nao preserva os commits da filha: compara conteudo, nao historico.
  $merged = @(Invoke-Git @('merge-tree', '--write-tree', "origin/$EpicBranch", $ChildBranch) -AllowFailure)
  $conflict = $LASTEXITCODE -ne 0
  $epicTree = Invoke-Git @('rev-parse', "origin/$EpicBranch^{tree}")
  if ($conflict -or $merged[0] -ne $epicTree) {
    throw "Conteudo de '$ChildBranch' ainda nao esta em origin/$EpicBranch. Faca o merge do PR antes (ou use -Force para descartar a filha)."
  }
}

function Get-BranchFromFolder {
  param([string]$Folder)
  # Pastas legadas de filha: epic-<n>--<type>-<m>-slug.
  if ($Folder -match '^epic-\d+--(.+)$') { $Folder = $Matches[1] }
  return $Folder -replace '^(epic|feature|hotfix)-', '$1/'
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

function New-ChildBranch {
  Assert-Slug
  Assert-Epic
  Invoke-Git @('fetch', 'origin') | Out-Null
  $epicBranch = Resolve-EpicBranch -EpicIssue $Epic
  $worktree = Get-EpicWorktree -EpicBranch $epicBranch
  if ($worktree.Branch -ne $epicBranch) {
    throw "Worktree da epic esta na branch '$($worktree.Branch)'. Finalize a filha atual com finish-child antes."
  }
  Assert-CleanWorktree -Path $worktree.Path
  $branch = "$Type/$Issue-$Slug"
  Assert-BranchFree -Branch $branch
  Invoke-Git @('-C', $worktree.Path, 'switch', '--no-track', '-c', $branch, "origin/$epicBranch") | Out-Null
  Write-Host "Worktree: $($worktree.Path)"
  Write-Host "Branch:   $branch (base origin/$epicBranch)"
  Write-Host "PR para:  $epicBranch"
}

function Complete-ChildBranch {
  Assert-Epic
  Invoke-Git @('fetch', 'origin') | Out-Null
  $epicBranch = Resolve-EpicBranch -EpicIssue $Epic
  $worktree = Get-EpicWorktree -EpicBranch $epicBranch
  $childBranch = Get-ChildBranch -ChildIssue $Issue
  if ($worktree.Branch -ne $childBranch -and $worktree.Branch -ne $epicBranch) {
    throw "Worktree da epic esta na branch '$($worktree.Branch)', nao em '$childBranch' nem '$epicBranch'."
  }
  Assert-CleanWorktree -Path $worktree.Path
  Assert-ChildMerged -ChildBranch $childBranch -EpicBranch $epicBranch
  Invoke-Git @('-C', $worktree.Path, 'switch', $epicBranch) | Out-Null
  Invoke-Git @('-C', $worktree.Path, 'merge', '--ff-only', "origin/$epicBranch") | Out-Null
  Invoke-Git @('branch', '-D', $childBranch) | Out-Null
  Write-Host "Worktree: $($worktree.Path)"
  Write-Host "Branch:   $epicBranch (alinhada com origin/$epicBranch)"
  Write-Host "Removida: $childBranch"
}

function Remove-IssueWorktree {
  $root = Get-WorktreesRoot
  $pattern = "^((epic|feature|hotfix)-$Issue-(?!-)|epic-\d+--(feature|hotfix)-$Issue-)"
  $found = @(Get-WorktreeEntries | Where-Object {
      (Split-Path -Parent $_.Path) -ieq $root -and (Split-Path -Leaf $_.Path) -match $pattern
    })
  if ($found.Count -eq 0) {
    throw "Nenhuma worktree encontrada para a issue #$Issue. Filha de epic nao tem worktree propria: use finish-child."
  }
  if ($found.Count -gt 1) { throw "Mais de uma worktree para a issue #$Issue." }

  $target = $found[0]
  $branch = Get-BranchFromFolder -Folder (Split-Path -Leaf $target.Path)
  if ($target.Branch -and $target.Branch -ne $branch) {
    throw "Worktree '$($target.Path)' esta na branch '$($target.Branch)'. Finalize a filha com finish-child antes de remover."
  }

  $here = [IO.Path]::GetFullPath((Get-Location).Path)
  if ($here.StartsWith($target.Path, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Saia de '$($target.Path)' antes de remove-la."
  }

  Invoke-Git @('worktree', 'remove', $target.Path) | Out-Null
  Invoke-Git @('branch', '-D', $branch) -AllowFailure | Out-Null
  Invoke-Git @('worktree', 'prune') | Out-Null
  Write-Host "Removida: $($target.Path) ($branch)"
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
    New-ChildBranch
  }
  'finish-child' {
    Complete-ChildBranch
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
