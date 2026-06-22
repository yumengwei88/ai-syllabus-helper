import { useState } from "react";
import "./App.css";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type SyllabusResult = {
  courseName: string;
  instructor: string;
  email: string;
  officeHours: string;
  gradingBreakdown: string[];
  importantDates: string[];
  latePolicy: string;
  attendancePolicy: string;
  requiredMaterials: string[];
  summary: string;
  warnings: string[];
};

type InputMode = "text" | "file";

function App() {
  const [syllabusText, setSyllabusText] = useState("");
  const [result, setResult] = useState<SyllabusResult | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

async function handleAnalyze() {
  setIsLoading(true);
  setErrorMessage("");
  setResult(null);

  try {
    let response: Response;

    if (inputMode === "text") {
      response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          syllabusText,
        }),
      });
    } else {
      if (!selectedFile) {
        throw new Error("Please choose a file.");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      response = await fetch(`${API_BASE_URL}/analyze-file`, {
        method: "POST",
        body: formData,
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "The syllabus could not be analyzed.");
    }

    setResult(data as SyllabusResult);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong.";

    console.error(error);
    setErrorMessage(message);
  } finally {
    setIsLoading(false);
  }
}
  return (
    <main className="page">
      <section className="hero">
       <h1>AI Syllabus Helper</h1>

       <p className="subtitle">
         Quickly summarize a syllabus by file upload or pasting text :D
       </p>
      </section>
     <section className="card input-card">

  <div className="input-mode-buttons">
    
  <button
    type="button"
    className={inputMode === "file" ? "mode-button active" : "mode-button"}
    onClick={() => setInputMode("file")}
  >
    Upload File
  </button>

  <button
    type="button"
    className={inputMode === "text" ? "mode-button active" : "mode-button"}
    onClick={() => setInputMode("text")}
  >
    Paste Text
  </button>
</div>

  {inputMode === "text" ? (
    <>
      <label htmlFor="syllabus">Paste syllabus text</label>

      <textarea
        id="syllabus"
        value={syllabusText}
        onChange={(event) => setSyllabusText(event.target.value)}
        placeholder="Paste your syllabus here..."
      />
    </>
  ) : (
    <>
      <label htmlFor="syllabus-file">
        Select a syllabus file
      </label>

      <input
        id="syllabus-file"
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setSelectedFile(file);
        }}
      />

      <p className="file-help">
        Supported formats: PDF, TXT, and MD. Maximum size: 10 MB.
      </p>

      {selectedFile && (
        <p className="selected-file">
          Selected: <strong>{selectedFile.name}</strong>
        </p>
      )}
    </>
  )}

  {errorMessage && (
    <p className="error-message">{errorMessage}</p>
  )}

  <button
    onClick={handleAnalyze}
    disabled={
      isLoading ||
      (inputMode === "text"
        ? syllabusText.trim() === ""
        : selectedFile === null)
    }
  >
    {isLoading ? "Analyzing..." : "Analyze Syllabus"}
  </button>
</section>

      {result && (
        <section className="results">
          <div className="card">
            <h2>{result.courseName}</h2>
            <p>
              <strong>Instructor:</strong> {result.instructor}
            </p>
            <p>
              <strong>Email:</strong> {result.email}
            </p>
            <p>
              <strong>Office Hours:</strong> {result.officeHours}
            </p>
          </div>

          <div className="card">
            <h3>Quick Summary</h3>
            <p>{result.summary}</p>
          </div>

          <div className="grid">
            <InfoList title="Important Dates" items={result.importantDates} />
            <InfoList title="Grading Breakdown" items={result.gradingBreakdown} />
            <InfoList title="Required Materials" items={result.requiredMaterials} />
            <InfoList title="Warnings" items={result.warnings} />
          </div>

          <div className="grid">
            <div className="card">
              <h3>Late Policy</h3>
              <p>{result.latePolicy}</p>
            </div>

            <div className="card">
              <h3>Attendance Policy</h3>
              <p>{result.attendancePolicy}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

type InfoListProps = {
  title: string;
  items: string[];
};

function InfoList({ title, items }: InfoListProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;