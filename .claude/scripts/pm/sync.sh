#!/bin/bash

# PM Sync - Full bidirectional sync between local and GitHub
# Usage: /pm:sync [epic_name]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
EPICS_DIR="$PROJECT_ROOT/.claude/epics"
TASKS_DIR="$PROJECT_ROOT/.claude/tasks"
TEMP_DIR="/tmp/pm-sync-$$"

SPECIFIC_EPIC="${1:-}"

# Ensure required directories exist
mkdir -p "$EPICS_DIR" "$TASKS_DIR" "$TEMP_DIR"

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "🔄 Starting sync..."
if [[ -n "$SPECIFIC_EPIC" ]]; then
    echo "Syncing epic: $SPECIFIC_EPIC"
fi
echo

# Check if gh CLI is available
if ! command -v gh >/dev/null 2>&1; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "Install with: brew install gh"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Error: Not logged in to GitHub"
    echo "Login with: gh auth login"
    exit 1
fi

# Step 1: Pull from GitHub
echo "📥 Pulling from GitHub..."

# Get epic issues
gh issue list --label "epic" --limit 1000 --json number,title,state,body,labels,updatedAt > "$TEMP_DIR/github_epics.json" 2>/dev/null || echo "[]" > "$TEMP_DIR/github_epics.json"

# Get task issues  
gh issue list --label "task" --limit 1000 --json number,title,state,body,labels,updatedAt > "$TEMP_DIR/github_tasks.json" 2>/dev/null || echo "[]" > "$TEMP_DIR/github_tasks.json"

# Count issues found
epic_count=$(jq length "$TEMP_DIR/github_epics.json")
task_count=$(jq length "$TEMP_DIR/github_tasks.json")
echo "Found $epic_count epics and $task_count tasks on GitHub"

# Step 2: Update Local from GitHub
echo
echo "⬇️ Updating local from GitHub..."

updated_count=0
closed_count=0
conflicts=0

# Function to update local file from GitHub
update_local_from_github() {
    local type="$1"
    local github_file="$2"
    local local_dir="$3"
    
    jq -r '.[] | @base64' "$github_file" | while read -r item; do
        # Decode JSON item
        issue=$(echo "$item" | base64 --decode)
        number=$(echo "$issue" | jq -r '.number')
        title=$(echo "$issue" | jq -r '.title')
        state=$(echo "$issue" | jq -r '.state')
        body=$(echo "$issue" | jq -r '.body // ""')
        updated_at=$(echo "$issue" | jq -r '.updatedAt')
        
        # Skip if filtering by specific epic and this isn't it
        if [[ -n "$SPECIFIC_EPIC" && "$type" == "epic" && "$title" != "$SPECIFIC_EPIC" ]]; then
            continue
        fi
        
        # Find local file by issue number in frontmatter
        local_file=""
        for file in "$local_dir"/*.md; do
            if [[ -f "$file" && $(grep -l "^github_issue: $number" "$file" 2>/dev/null || true) ]]; then
                local_file="$file"
                break
            fi
        done
        
        if [[ -z "$local_file" ]]; then
            # Create new local file from GitHub issue
            safe_title=$(echo "$title" | sed 's/[^a-zA-Z0-9_-]/_/g' | tr '[:upper:]' '[:lower:]')
            local_file="$local_dir/${safe_title}.md"
            
            cat > "$local_file" << EOF
---
title: $title
type: $type
status: $(echo "$state" | tr '[:upper:]' '[:lower:]')
github_issue: $number
github_url: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues/$number
created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
updated: $updated_at
last_sync: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
---

$body
EOF
            echo "Created: $local_file"
            ((updated_count++))
            continue
        fi
        
        # Check if local file needs updating
        local_updated=$(grep "^updated:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "1970-01-01T00:00:00Z")
        local_sync=$(grep "^last_sync:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "1970-01-01T00:00:00Z")
        
        # Convert dates for comparison (simplified - assumes ISO format)
        github_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$updated_at" +%s 2>/dev/null || echo 0)
        local_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$local_updated" +%s 2>/dev/null || echo 0)
        sync_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$local_sync" +%s 2>/dev/null || echo 0)
        
        # Check for conflicts (both changed since last sync)
        if [[ $github_epoch -gt $sync_epoch && $local_epoch -gt $sync_epoch ]]; then
            echo "⚠️ Conflict detected: $local_file"
            echo "Both local and GitHub have changes since last sync"
            echo -n "Keep: (local/github/merge)? "
            read -r choice
            case "$choice" in
                "github"|"g")
                    # Update local with GitHub content
                    ;;
                "merge"|"m")
                    echo "Manual merge not implemented yet - keeping local"
                    ((conflicts++))
                    continue
                    ;;
                *)
                    echo "Keeping local version"
                    ((conflicts++))
                    continue
                    ;;
            esac
        elif [[ $github_epoch -le $sync_epoch ]]; then
            # GitHub not newer, skip
            continue
        fi
        
        # Update local file with GitHub content
        # Extract existing frontmatter and update specific fields
        temp_body=$(mktemp)
        echo "$body" > "$temp_body"
        
        # Update frontmatter
        sed -i.bak \
            -e "s/^status:.*/status: $(echo "$state" | tr '[:upper:]' '[:lower:]')/" \
            -e "s/^updated:.*/updated: $updated_at/" \
            -e "s/^last_sync:.*/last_sync: $(date -u +"%Y-%m-%dT%H:%M:%SZ")/" \
            "$local_file"
        
        # Update body content after frontmatter
        awk '/^---$/ && NR>1 {found++} found==2 {exit} {print}' "$local_file" > "$local_file.tmp"
        echo >> "$local_file.tmp"
        cat "$temp_body" >> "$local_file.tmp"
        mv "$local_file.tmp" "$local_file"
        
        rm -f "$local_file.bak" "$temp_body"
        
        echo "Updated: $local_file"
        ((updated_count++))
        
        if [[ "$state" == "closed" ]]; then
            ((closed_count++))
        fi
    done
}

# Update epics from GitHub
if [[ -z "$SPECIFIC_EPIC" || -f "$EPICS_DIR/${SPECIFIC_EPIC}.md" ]]; then
    update_local_from_github "epic" "$TEMP_DIR/github_epics.json" "$EPICS_DIR"
fi

# Update tasks from GitHub (unless specific epic that doesn't exist)
if [[ -z "$SPECIFIC_EPIC" ]]; then
    update_local_from_github "task" "$TEMP_DIR/github_tasks.json" "$TASKS_DIR"
fi

# Step 3: Push Local to GitHub
echo
echo "⬆️ Pushing local to GitHub..."

pushed_count=0
created_count=0

# Function to push local files to GitHub
push_local_to_github() {
    local type="$1"
    local local_dir="$2"
    
    for local_file in "$local_dir"/*.md; do
        [[ -f "$local_file" ]] || continue
        
        filename=$(basename "$local_file" .md)
        
        # Skip if filtering by specific epic and this isn't it
        if [[ -n "$SPECIFIC_EPIC" && "$type" == "epic" && "$filename" != "$SPECIFIC_EPIC" ]]; then
            continue
        fi
        
        # Extract frontmatter
        title=$(grep "^title:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "$filename")
        status=$(grep "^status:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "open")
        github_issue=$(grep "^github_issue:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "")
        github_url=$(grep "^github_url:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "")
        local_updated=$(grep "^updated:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "")
        last_sync=$(grep "^last_sync:" "$local_file" 2>/dev/null | cut -d' ' -f2- || echo "1970-01-01T00:00:00Z")
        
        # Extract body content (after frontmatter)
        body_file=$(mktemp)
        awk '/^---$/ && NR>1 {found++} found==2 {skip=1; next} skip {print}' "$local_file" > "$body_file"
        
        if [[ -z "$github_issue" ]]; then
            # Create new GitHub issue
            echo "Creating new $type: $title"
            
            # Create issue with appropriate labels
            labels="$type"
            if [[ "$type" == "task" ]]; then
                # Try to find parent epic from title or content
                epic_name=$(echo "$title" | grep -o '\[.*\]' | tr -d '[]' || echo "")
                if [[ -n "$epic_name" ]]; then
                    labels="$labels,epic:$epic_name"
                fi
            fi
            
            # Set state for gh issue create
            state_flag=""
            if [[ "$status" == "closed" ]]; then
                state_flag="--assignee @me"  # Will create open, we'll close after
            fi
            
            new_issue=$(gh issue create \
                --title "$title" \
                --body-file "$body_file" \
                --label "$labels" \
                $state_flag 2>/dev/null || echo "")
            
            if [[ -n "$new_issue" ]]; then
                # Extract issue number from URL
                issue_number=$(echo "$new_issue" | grep -o '[0-9]\+$')
                repo_url=$(gh repo view --json url -q .url)
                
                # Close if needed
                if [[ "$status" == "closed" ]]; then
                    gh issue close "$issue_number" >/dev/null 2>&1 || true
                fi
                
                # Update local file with GitHub info
                sed -i.bak \
                    -e "/^github_issue:/c\\github_issue: $issue_number" \
                    -e "/^github_url:/c\\github_url: $new_issue" \
                    -e "s/^last_sync:.*/last_sync: $(date -u +"%Y-%m-%dT%H:%M:%SZ")/" \
                    "$local_file"
                rm -f "$local_file.bak"
                
                echo "Created: $new_issue"
                ((created_count++))
            else
                echo "Failed to create issue for: $title"
            fi
            
        elif [[ -n "$local_updated" && -n "$last_sync" ]]; then
            # Check if local is newer than last sync
            local_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$local_updated" +%s 2>/dev/null || echo 0)
            sync_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_sync" +%s 2>/dev/null || echo 0)
            
            if [[ $local_epoch -gt $sync_epoch ]]; then
                # Update existing GitHub issue
                echo "Updating issue #$github_issue: $title"
                
                if gh issue edit "$github_issue" --body-file "$body_file" >/dev/null 2>&1; then
                    # Update state if needed
                    current_state=$(gh issue view "$github_issue" --json state -q .state | tr '[:upper:]' '[:lower:]')
                    if [[ "$status" != "$current_state" ]]; then
                        if [[ "$status" == "closed" ]]; then
                            gh issue close "$github_issue" >/dev/null 2>&1 || true
                        elif [[ "$status" == "open" ]]; then
                            gh issue reopen "$github_issue" >/dev/null 2>&1 || true
                        fi
                    fi
                    
                    # Update sync timestamp
                    sed -i.bak "s/^last_sync:.*/last_sync: $(date -u +"%Y-%m-%dT%H:%M:%SZ")/" "$local_file"
                    rm -f "$local_file.bak"
                    
                    echo "Updated: #$github_issue"
                    ((pushed_count++))
                else
                    echo "Failed to update issue #$github_issue (may have been deleted)"
                    # Mark local as archived
                    sed -i.bak "s/^status:.*/status: archived/" "$local_file"
                    rm -f "$local_file.bak"
                fi
            fi
        fi
        
        rm -f "$body_file"
    done
}

# Push epics to GitHub
if [[ -d "$EPICS_DIR" ]]; then
    push_local_to_github "epic" "$EPICS_DIR"
fi

# Push tasks to GitHub
if [[ -d "$TASKS_DIR" && -z "$SPECIFIC_EPIC" ]]; then
    push_local_to_github "task" "$TASKS_DIR"
fi

# Step 4: Output summary
echo
echo "🔄 Sync Complete"
echo
echo "Pulled from GitHub:"
echo "  Updated: $updated_count files"
echo "  Closed: $closed_count issues"
echo
echo "Pushed to GitHub:"
echo "  Updated: $pushed_count issues"
echo "  Created: $created_count new issues"
echo

if [[ $conflicts -gt 0 ]]; then
    echo "Conflicts resolved: $conflicts"
    echo
fi

if [[ $updated_count -eq 0 && $pushed_count -eq 0 && $created_count -eq 0 ]]; then
    echo "Status:"
    echo "  ✅ All files already synced"
else
    echo "Status:"
    echo "  ✅ All files synced"
fi