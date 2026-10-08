#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: ./install.sh [--agent-dir PATH] [--backup]

Link config.yml, AGENTS.md and skills to this repository.
Default directory: $PI_CODING_AGENT_DIR or ~/.omp/agent.
Existing paths are left untouched unless --backup is supplied.
--backup moves conflicting paths into a new backup directory under the agent directory.
EOF
}

agent_dir=${PI_CODING_AGENT_DIR:-"$HOME/.omp/agent"}
backup=false
while (($#)); do
    case $1 in
        --agent-dir)
            if (($# < 2)) || [[ -z $2 ]]; then
                printf 'Error: --agent-dir requires a path.\n' >&2
                exit 1
            fi
            agent_dir=$2
            shift 2
            ;;
        --backup) backup=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) printf 'Error: unknown argument: %s\n' "$1" >&2; usage >&2; exit 1 ;;
    esac
done

# Resolve the script itself, not the caller's working directory.
repo_dir=$(dirname -- "$(realpath -- "${BASH_SOURCE[0]}")")
agent_dir=$(realpath -m -- "$agent_dir")
sources=("$repo_dir/global/config.yml" "$repo_dir/global/AGENTS.md")
targets=("$agent_dir/config.yml" "$agent_dir/AGENTS.md")
for skill in "$repo_dir"/skills/*; do
    [[ -d $skill && -f $skill/SKILL.md ]] || continue
    sources+=("$skill")
    targets+=("$agent_dir/skills/${skill##*/}")
done

# Check every conflict before changing anything. Broken symlinks count as conflicts.
conflicts=()
for i in "${!sources[@]}"; do
    source_path=${sources[i]}
    target_path=${targets[i]}
    if [[ $source_path == "$target_path" ]]; then
        printf 'Error: source and destination are identical: %s\n' "$source_path" >&2
        exit 1
    fi
    if [[ $(realpath -m -- "$target_path") == "$source_path" ]]; then
        if [[ -L $target_path ]]; then
            continue
        fi
        printf 'Error: destination resolves to the source without its own symlink: %s\n' "$target_path" >&2
        exit 1
    fi
    if [[ -e $target_path || -L $target_path ]]; then
        conflicts+=("$i")
        printf 'Existing path: %s\n' "$target_path" >&2
    fi
done
if ((${#conflicts[@]})) && [[ $backup == false ]]; then
    printf 'Nothing changed. Use --backup to preserve and replace existing paths.\n' >&2
    exit 1
fi

mkdir -p -- "$agent_dir/skills"
if ((${#conflicts[@]})); then
    backup_dir=$(mktemp -d "$agent_dir/omp-harness-backup.XXXXXXXX")
    for i in "${conflicts[@]}"; do
        target_path=${targets[i]}
        relative_path=${target_path#"$agent_dir/"}
        mkdir -p -- "$(dirname -- "$backup_dir/$relative_path")"
        mv -- "$target_path" "$backup_dir/$relative_path"
    done
    printf 'Backup: %s\n' "$backup_dir"
fi
for i in "${!sources[@]}"; do
    target_path=${targets[i]}
    if [[ -L $target_path ]] && [[ $(realpath -m -- "$target_path") == "${sources[i]}" ]]; then
        printf 'Already linked: %s\n' "$target_path"
    else
        ln -s -- "${sources[i]}" "$target_path"
        printf 'Linked: %s -> %s\n' "$target_path" "${sources[i]}"
    fi
done
printf 'Start a new OMP session to load the configuration, context and skills.\n'
