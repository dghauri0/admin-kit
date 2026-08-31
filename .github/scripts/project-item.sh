#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 || $# -gt 7 ]]; then
  echo "Usage: project-item.sh URL_OR_ITEM_ID PRODUCT WORK_TYPE [PRIORITY] [HORIZON] [EFFORT] [STATUS]" >&2
  exit 2
fi

target=$1
product=$2
work_type=$3
priority=${4:-P3}
horizon=${5:-Next}
effort=${6:-M}
item_status=${7:-Inbox}
owner=${AFFECTIVE_PROJECT_OWNER:-dghauri0}
project_number=${AFFECTIVE_PROJECT_NUMBER:-5}

command -v gh >/dev/null || { echo "gh is required" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
gh auth status --hostname github.com >/dev/null

project_id=$(gh project view "$project_number" --owner "$owner" --format json --jq .id)
fields=$(gh project field-list "$project_number" --owner "$owner" --format json)

if [[ "$target" == http://* || "$target" == https://* ]]; then
  item_id=$(gh project item-add "$project_number" --owner "$owner" --url "$target" --format json --jq .id)
else
  item_id=$target
fi

set_single_select() {
  local field_name=$1
  local option_name=$2
  local field_id option_id
  field_id=$(jq -r --arg field "$field_name" '.fields[] | select(.name == $field) | .id' <<<"$fields")
  option_id=$(jq -r --arg field "$field_name" --arg option "$option_name" '.fields[] | select(.name == $field) | .options[] | select(.name == $option) | .id' <<<"$fields")
  [[ -n "$field_id" && "$field_id" != null ]] || { echo "Project field not found: $field_name" >&2; exit 1; }
  [[ -n "$option_id" && "$option_id" != null ]] || { echo "Invalid $field_name value: $option_name" >&2; exit 1; }
  gh project item-edit --id "$item_id" --project-id "$project_id" --field-id "$field_id" --single-select-option-id "$option_id" >/dev/null
}

set_single_select Status "$item_status"
set_single_select Priority "$priority"
set_single_select Horizon "$horizon"
set_single_select Product "$product"
set_single_select "Work type" "$work_type"
set_single_select Effort "$effort"

printf 'Classified Project item %s: %s / %s / %s / %s / %s / %s\n' "$item_id" "$item_status" "$priority" "$horizon" "$product" "$work_type" "$effort"
