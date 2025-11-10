# Script to add dynamic export to all page.tsx files

$pages = Get-ChildItem -Path "c:\Users\PC\Guide-Validator\app\[[]locale[]]\*\*" -Filter "page.tsx" -Recurse

foreach ($page in $pages) {
    $content = Get-Content $page.FullName -Raw

    # Check if already has the export
    if ($content -notmatch 'export\s+const\s+dynamic\s*=') {
        Write-Host "Adding dynamic export to: $($page.FullName)"

        # Add export at the beginning of the file
        $newContent = 'export const dynamic = "force-dynamic";' + "`n`n" + $content
        Set-Content -Path $page.FullName -Value $newContent -NoNewline
    } else {
        Write-Host "Already has dynamic export: $($page.FullName)"
    }
}

Write-Host "`nDone! Processed $($pages.Count) files."
