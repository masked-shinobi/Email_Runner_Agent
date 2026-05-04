from fastapi import APIRouter
import subprocess
import os

router = APIRouter(prefix="/sync", tags=["Sync"])

@router.post("/")
def trigger_sync():
    # Use the venv python to run the fetcher script
    python_path = os.path.join("venv", "Scripts", "python.exe")
    # Run the fetcher script in the background
    subprocess.Popen([python_path, "-m", "core.fetcher"])
    return {"status": "Sync started in background"}
