import os
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from pypdf import PdfReader


# Load backend/.env
env_path = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY was not found in backend/.env")

client = OpenAI(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SyllabusRequest(BaseModel):
    syllabusText: str


class SyllabusAnalysis(BaseModel):
    courseName: str
    instructor: str
    email: str
    officeHours: str
    gradingBreakdown: list[str]
    importantDates: list[str]
    latePolicy: str
    attendancePolicy: str
    requiredMaterials: list[str]
    summary: str
    warnings: list[str]


def analyze_with_ai(syllabus_text: str) -> SyllabusAnalysis:
    """Send extracted syllabus text to OpenAI."""

    syllabus_text = syllabus_text.strip()

    if not syllabus_text:
        raise HTTPException(
            status_code=400,
            detail="No readable syllabus text was provided.",
        )

    try:
        response = client.responses.parse(
            model="gpt-5.4-nano",
            input=[
                {
                    "role": "system",
                    "content": (
                        "You analyze college syllabuses for students. "
                        "Extract only information supported by the provided syllabus. "
                        "Do not invent information. Use 'Not found' when a text field "
                        "is missing, and use an empty list when a list has no matching "
                        "information. Preserve dates, percentages, policies, and contact "
                        "details accurately. Write the summary in simple, clear language. "
                        "Warnings should identify important rules such as strict attendance, "
                        "late penalties, major exams, required participation, or unusual policies."
                    ),
                },
                {
                    "role": "user",
                    "content": syllabus_text,
                },
            ],
            text_format=SyllabusAnalysis,
        )

        analysis = response.output_parsed

        if analysis is None:
            raise HTTPException(
                status_code=500,
                detail="The AI did not return a valid analysis.",
            )

        return analysis

    except HTTPException:
        raise
    except Exception as error:
        print(f"OpenAI API error: {error}")

        raise HTTPException(
            status_code=500,
            detail="The syllabus could not be analyzed.",
        )


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract embedded text from a PDF."""

    try:
        reader = PdfReader(BytesIO(file_bytes))

        extracted_pages = [
            page.extract_text() or ""
            for page in reader.pages
        ]

        return "\n".join(extracted_pages).strip()

    except Exception as error:
        print(f"PDF extraction error: {error}")

        raise HTTPException(
            status_code=400,
            detail="The PDF could not be read.",
        )


@app.get("/")
def home():
    return {"message": "AI Syllabus backend is running"}


@app.post("/analyze", response_model=SyllabusAnalysis)
def analyze_pasted_text(request: SyllabusRequest):
    return analyze_with_ai(request.syllabusText)


@app.post("/analyze-file", response_model=SyllabusAnalysis)
async def analyze_uploaded_file(
    file: UploadFile = File(...),
):
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    allowed_extensions = {".pdf", ".txt", ".md"}

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF, TXT, or MD file.",
        )

    file_bytes = await file.read()

    # Limit uploads to 10 MB
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="The file is too large. Maximum size is 10 MB.",
        )

    if extension == ".pdf":
        syllabus_text = extract_pdf_text(file_bytes)
    else:
        try:
            syllabus_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="The text file could not be read.",
            )

    if not syllabus_text.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text was found. The PDF may be scanned "
                "or contain only images."
            ),
        )

    return analyze_with_ai(syllabus_text)