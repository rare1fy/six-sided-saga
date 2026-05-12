# Pass 3: Convert standalone .fill() and .stroke() calls
# These appear after path commands (moveTo, lineTo, arc, ellipse, closePath)
# Strategy: 
#   .fill({color, alpha}) → replace with endFill(), and insert beginFill(color, alpha) before the path start
#   .stroke({color, width, alpha}) → replace with lineStyle(0), and insert lineStyle(width, color, alpha) before path start

param([string]$FilePath)

$lines = [System.IO.File]::ReadAllLines($FilePath, [System.Text.Encoding]::UTF8)
$newLines = New-Object System.Collections.ArrayList

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    $indent = if ($line -match '^(\s*)') { $Matches[1] } else { '' }
    
    # Match standalone .fill({color: X, alpha: Y})
    if ($line -match '^\s*(\w+(?:\.\w+)*)\.fill\(\{\s*color:\s*(.+?)(?:,\s*alpha:\s*(.+?))?\s*\}\);\s*$') {
        $varName = $Matches[1]
        $color = $Matches[2].Trim()
        $alpha = if ($Matches[3]) { $Matches[3].Trim() } else { $null }
        
        # Look backwards for the start of the path (first line with this var doing moveTo/drawXxx/beginFill after a clear() or other non-path line)
        $pathStart = -1
        for ($j = $i - 1; $j -ge 0; $j--) {
            $prevLine = $lines[$j]
            # If we hit a clear(), beginFill, endFill, or a line that doesn't reference our var, that's the boundary
            if ($prevLine -match "$([regex]::Escape($varName))\.(clear|beginFill|endFill|lineStyle)\(") {
                $pathStart = $j + 1
                break
            }
            # If line doesn't reference our var at all, path starts after this
            if ($prevLine -notmatch [regex]::Escape($varName)) {
                $pathStart = $j + 1
                break
            }
        }
        if ($pathStart -eq -1) { $pathStart = [Math]::Max(0, $i - 1) }
        
        # Insert beginFill at pathStart
        $fillLine = if ($alpha) { "${indent}${varName}.beginFill($color, $alpha);" } else { "${indent}${varName}.beginFill($color);" }
        $newLines.Insert($pathStart + ($newLines.Count - $lines.Length + ($lines.Length - $i)), $fillLine) | Out-Null
        # Actually this is getting complex with index tracking. Simpler approach:
        # Just replace the .fill() line with endFill() and prepend beginFill before the previous shape line
        
        # Simpler: replace current line with endFill, and modify the already-added line at pathStart
        $null = $newLines.Add("${indent}${varName}.endFill();")
        
        # We need to go back and insert beginFill. Since we already added lines, find the right spot
        $insertIdx = $newLines.Count - ($i - $pathStart) - 1
        if ($insertIdx -ge 0 -and $insertIdx -lt $newLines.Count) {
            $newLines.Insert($insertIdx, $fillLine) | Out-Null
        } else {
            # Fallback: just put beginFill right before endFill
            $newLines.Insert($newLines.Count - 1, $fillLine) | Out-Null
        }
        continue
    }
    
    # Match standalone .stroke({color: X, width: Y, alpha: Z})
    if ($line -match '^\s*(\w+(?:\.\w+)*)\.stroke\(\{\s*color:\s*(.+?)(?:,\s*width:\s*(.+?))?(?:,\s*alpha:\s*(.+?))?\s*\}\);\s*$') {
        $varName = $Matches[1]
        $color = $Matches[2].Trim()
        $width = if ($Matches[3]) { $Matches[3].Trim() } else { '1' }
        $alpha = if ($Matches[4]) { $Matches[4].Trim() } else { '1' }
        
        # Look backwards for path start
        $pathStart = -1
        for ($j = $i - 1; $j -ge 0; $j--) {
            $prevLine = $lines[$j]
            if ($prevLine -match "$([regex]::Escape($varName))\.(clear|beginFill|endFill|lineStyle)\(") {
                $pathStart = $j + 1
                break
            }
            if ($prevLine -notmatch [regex]::Escape($varName)) {
                $pathStart = $j + 1
                break
            }
        }
        if ($pathStart -eq -1) { $pathStart = [Math]::Max(0, $i - 1) }
        
        $styleLine = "${indent}${varName}.lineStyle($width, $color, $alpha);"
        $null = $newLines.Add("${indent}${varName}.lineStyle(0);")
        
        $insertIdx = $newLines.Count - ($i - $pathStart) - 1
        if ($insertIdx -ge 0 -and $insertIdx -lt $newLines.Count) {
            $newLines.Insert($insertIdx, $styleLine) | Out-Null
        } else {
            $newLines.Insert($newLines.Count - 1, $styleLine) | Out-Null
        }
        continue
    }
    
    $null = $newLines.Add($line)
}

$newContent = ($newLines -join "`r`n")
[System.IO.File]::WriteAllText($FilePath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "PASS3: $FilePath"
