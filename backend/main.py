from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from parser import parse_courses  # Make sure this is the right filename

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FalconSched backend running"}

@app.get("/courses")
def get_courses():
    return parse_courses()
