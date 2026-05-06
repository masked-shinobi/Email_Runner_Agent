from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import emails, chat, sync, config

app = FastAPI(title="AI Email Assistant API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(emails.router)
app.include_router(chat.router)
app.include_router(sync.router)
app.include_router(config.router)

@app.get("/")
def read_root():
    return {"message": "AI Email Assistant API is running"}
