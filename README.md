# AI Syllabus Helper

AI Syllabus Helper is a full-stack web app that helps students quickly understand a course syllabus. Users can upload a PDF, TXT, or MD syllabus file, or paste syllabus text directly. The app uses AI to extract important class information such as grading breakdowns, deadlines, policies, required materials, and warnings.

## Features

- Upload a PDF, TXT, or MD syllabus file
- Paste syllabus text manually
- Extract course name, instructor, email, office hours, grading breakdown, important dates, policies, and required materials
- Generate a simple AI-powered summary
- Display warnings for important rules such as late penalties, attendance requirements, or major exams
- Loading and error states
- API key protection using environment variables

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- Pydantic
- pypdf
- OpenAI API

## How It Works

1. The user uploads a syllabus file or pastes syllabus text.
2. The React frontend sends the input to the FastAPI backend.
3. If the user uploads a PDF, the backend extracts embedded text using pypdf.
4. The backend sends the syllabus text to the OpenAI API.
5. The AI returns structured syllabus information.
6. FastAPI validates the response and sends JSON back to React.
7. React displays the results in organized summary cards.

## Running Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000