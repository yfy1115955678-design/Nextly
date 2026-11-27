import argparse
import json
import sys

from app.services.backup_service import BackupError, restore_staged_backup
from app.services.instance_lock import acquire_instance_lock


def main() -> int:
    parser = argparse.ArgumentParser(prog="nextly")
    subparsers = parser.add_subparsers(dest="command", required=True)
    restore_parser = subparsers.add_parser(
        "restore",
        help="Restore a staged backup. Stop the Nextly API before running this command.",
    )
    restore_parser.add_argument("--staged-id", required=True)
    args = parser.parse_args()

    if args.command == "restore":
        try:
            with acquire_instance_lock():
                result = restore_staged_backup(args.staged_id)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 0
        except (BackupError, FileNotFoundError, RuntimeError) as exc:
            print(f"Restore failed: {exc}", file=sys.stderr)
            return 1

    return 2


if __name__ == "__main__":
    raise SystemExit(main())