#!/usr/bin/env python3
"""
Editor-independent auto-commit watcher for Q8 Parking PWA.
Polls for file changes and auto-commits/pushes to main.
No external dependencies. Run with --install to add to Windows Startup.
"""
import argparse
import os
import subprocess
import sys
import time

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POLL_INTERVAL = 15
COMMIT_MSG = "auto: update"
STARTUP_FOLDER = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")


def run(cmd, check=True, capture=True):
    r = subprocess.run(cmd, cwd=REPO_ROOT, shell=True, capture_output=capture, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}")
    return r


def has_changes():
    r = subprocess.run("git status --porcelain", cwd=REPO_ROOT, shell=True, capture_output=True, text=True)
    return bool(r.stdout.strip())


def commit_and_push():
    run("git add -A")
    if not has_changes():
        return False
    run(f'git commit -m "{COMMIT_MSG}"')
    run("git push origin main")
    return True


def install_startup():
    if sys.platform != "win32":
        return
    vbs_path = os.path.join(STARTUP_FOLDER, "q8-parking-auto-commit.vbs")
    script_path = os.path.join(REPO_ROOT, "scripts", "auto-commit-watcher.py")
    vbs_content = f'''Set wsh = CreateObject("WScript.Shell")
wsh.CurrentDirectory = "{REPO_ROOT}"
wsh.Run "pythonw ""{script_path}""", 0, False
'''
    os.makedirs(STARTUP_FOLDER, exist_ok=True)
    with open(vbs_path, "w", encoding="utf-8") as f:
        f.write(vbs_content)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--install", action="store_true", help="Add to Windows Startup")
    args = parser.parse_args()

    if args.install:
        install_startup()
        return

    os.chdir(REPO_ROOT)
    while True:
        try:
            if has_changes():
                commit_and_push()
        except Exception:
            pass
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
