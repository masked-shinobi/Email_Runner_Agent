from fastapi import APIRouter
import subprocess
import os

router = APIRouter(prefix="/sync", tags=["Sync"])

@router.post("/")
def trigger_sync():
    # Use the venv python to run the fetcher scripts
    python_path = os.path.join("venv", "Scripts", "python.exe")
    
    # Run the fetcher scripts in the background
    subprocess.Popen([python_path, "-m", "core.fetcher"])
    subprocess.Popen([python_path, "-m", "core.imap_fetcher"])
    
    # Run the AI worker in the background
    subprocess.Popen([python_path, "-m", "core.ai_worker"])
    
    return {"status": "Fast sync started. AI processing will follow in the background."}
