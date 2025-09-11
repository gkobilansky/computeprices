#!/bin/bash

# PM Clean - Archive completed work and remove stale files
# Usage: /pm:clean [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
EPICS_DIR="$PROJECT_ROOT/.claude/epics"
PROGRESS_DIR="$PROJECT_ROOT/.claude/progress"
ARCHIVED_DIR="$EPICS_DIR/.archived"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
fi

echo "🧹 Cleanup Plan"
echo

# Find completed epics
completed_epics=()
stale_days=30
current_epoch=$(date +%s)
cutoff_epoch=$((current_epoch - (stale_days * 24 * 60 * 60)))

if [[ -d "$EPICS_DIR" ]]; then
    for epic_file in "$EPICS_DIR"/*.md; do
        if [[ -f "$epic_file" ]]; then
            epic_name=$(basename "$epic_file" .md)
            
            # Check if epic is completed
            if grep -q "^status: completed" "$epic_file" 2>/dev/null; then
                # Check last modified date
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    file_epoch=$(stat -f %m "$epic_file")
                else
                    file_epoch=$(stat -c %Y "$epic_file")
                fi
                
                if [[ $file_epoch -lt $cutoff_epoch ]]; then
                    days_ago=$(( (current_epoch - file_epoch) / (24 * 60 * 60) ))
                    completed_epics+=("$epic_name:$days_ago")
                fi
            fi
        fi
    done
fi

# Find stale progress files
stale_progress=()
if [[ -d "$PROGRESS_DIR" ]]; then
    for progress_file in "$PROGRESS_DIR"/*.md; do
        if [[ -f "$progress_file" ]]; then
            # Check if file is old
            if [[ "$OSTYPE" == "darwin"* ]]; then
                file_epoch=$(stat -f %m "$progress_file")
            else
                file_epoch=$(stat -c %Y "$progress_file")
            fi
            
            if [[ $file_epoch -lt $cutoff_epoch ]]; then
                stale_progress+=("$progress_file")
            fi
        fi
    done
fi

# Find empty directories
empty_dirs=()
if [[ -d "$PROJECT_ROOT/.claude" ]]; then
    while IFS= read -r -d '' dir; do
        if [[ -d "$dir" && ! "$dir" == *"/.git"* ]]; then
            empty_dirs+=("$dir")
        fi
    done < <(find "$PROJECT_ROOT/.claude" -type d -empty -print0 2>/dev/null || true)
fi

# Calculate total size to recover
total_size=0
for epic in "${completed_epics[@]-}"; do
    epic_name="${epic%:*}"
    if [[ -f "$EPICS_DIR/$epic_name.md" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            size=$(stat -f %z "$EPICS_DIR/$epic_name.md")
        else
            size=$(stat -c %s "$EPICS_DIR/$epic_name.md")
        fi
        total_size=$((total_size + size))
    fi
done

for file in "${stale_progress[@]-}"; do
    if [[ -f "$file" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            size=$(stat -f %z "$file")
        else
            size=$(stat -c %s "$file")
        fi
        total_size=$((total_size + size))
    fi
done

total_kb=$((total_size / 1024))

# Display cleanup plan
if [[ ${#completed_epics[@]-} -gt 0 ]]; then
    echo "Completed Epics to Archive:"
    for epic in "${completed_epics[@]-}"; do
        epic_name="${epic%:*}"
        days="${epic#*:}"
        echo "  $epic_name - Completed $days days ago"
    done
    echo
fi

if [[ ${#stale_progress[@]-} -gt 0 ]]; then
    echo "Stale Progress to Remove:"
    echo "  ${#stale_progress[@]} progress files for old work"
    echo
fi

if [[ ${#empty_dirs[@]-} -gt 0 ]]; then
    echo "Empty Directories:"
    for dir in "${empty_dirs[@]-}"; do
        echo "  ${dir#$PROJECT_ROOT/}"
    done
    echo
fi

echo "Space to Recover: ~${total_kb}KB"
echo

if [[ $DRY_RUN == true ]]; then
    echo "This is a dry run. No changes made."
    exit 0
fi

# If nothing to clean
if [[ ${#completed_epics[@]-} -eq 0 && ${#stale_progress[@]-} -eq 0 && ${#empty_dirs[@]-} -eq 0 ]]; then
    echo "✅ Nothing to clean. System is already organized."
    exit 0
fi

# Confirm with user
echo -n "Proceed with cleanup? (yes/no): "
read -r response
if [[ "$response" != "yes" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo
echo "🧹 Executing cleanup..."

# Create archived directory if needed
mkdir -p "$ARCHIVED_DIR"

# Archive completed epics
archived_count=0
if [[ ${#completed_epics[@]-} -gt 0 ]]; then
    for epic in "${completed_epics[@]-}"; do
        epic_name="${epic%:*}"
        if [[ -f "$EPICS_DIR/$epic_name.md" ]]; then
            mv "$EPICS_DIR/$epic_name.md" "$ARCHIVED_DIR/"
            echo "  Archived: $epic_name"
            archived_count=$((archived_count + 1))
        fi
    done
fi

# Remove stale progress files
removed_count=0
for file in "${stale_progress[@]-}"; do
    if [[ -f "$file" ]]; then
        rm "$file"
        removed_count=$((removed_count + 1))
    fi
done

# Remove empty directories
cleaned_dirs=0
for dir in "${empty_dirs[@]-}"; do
    if [[ -d "$dir" ]]; then
        rmdir "$dir" 2>/dev/null || true
        cleaned_dirs=$((cleaned_dirs + 1))
    fi
done

# Create archive log
if [[ $archived_count -gt 0 ]]; then
    log_file="$ARCHIVED_DIR/archive-log.md"
    current_date=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ ! -f "$log_file" ]]; then
        echo "# Archive Log" > "$log_file"
        echo >> "$log_file"
    fi
    
    echo "## $current_date" >> "$log_file"
    for epic in "${completed_epics[@]-}"; do
        epic_name="${epic%:*}"
        days="${epic#*:}"
        echo "- Archived: $epic_name (completed $days days ago)" >> "$log_file"
    done
    if [[ $removed_count -gt 0 ]]; then
        echo "- Removed: $removed_count stale progress files" >> "$log_file"
    fi
    if [[ $cleaned_dirs -gt 0 ]]; then
        echo "- Cleaned: $cleaned_dirs empty directories" >> "$log_file"
    fi
    echo >> "$log_file"
fi

# Output results
echo
echo "✅ Cleanup Complete"
echo
if [[ $archived_count -gt 0 ]]; then
    echo "Archived:"
    echo "  $archived_count completed epics"
    echo
fi
if [[ $removed_count -gt 0 || $cleaned_dirs -gt 0 ]]; then
    echo "Removed:"
    if [[ $removed_count -gt 0 ]]; then
        echo "  $removed_count stale files"
    fi
    if [[ $cleaned_dirs -gt 0 ]]; then
        echo "  $cleaned_dirs empty directories"
    fi
    echo
fi
echo "Space recovered: ${total_kb}KB"
echo
echo "System is clean and organized."