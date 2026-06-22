### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Create a `.env` file inside the `backend` folder:

```bash
OPENAI_API_KEY=your_api_key_here
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```txt
http://localhost:5173/
```

The backend runs at:

```txt
http://localhost:8000/
```

## Limitations

- Scanned PDFs are not supported yet because the app currently extracts embedded PDF text, not image-based text.
- The app currently runs locally and is not deployed.
- Calendar export and syllabus Q&A are planned future features.

## Future Improvements

- Add drag-and-drop file upload
- Add syllabus question-answering
- Add Google Calendar export for deadlines
- Support scanned PDFs with OCR
- Deploy the frontend and backend online