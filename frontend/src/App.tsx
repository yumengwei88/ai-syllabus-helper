import { useEffect, useState } from "react";
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

function formatList(items: string[]) {
  if (items.length === 0) {
    return "Not found";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function makeFileName(courseName: string) {
  const cleanedName = courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return cleanedName || "syllabhus-summary";
}

function buildDownloadText(result: SyllabusResult) {
  return `AI Syllabus Helper Summary

 Course: ${result.courseName}

 Instructor: ${result.instructor}
 Email: ${result.email}
 Office Hours: ${result.officeHours}

 Quick Summary:
 ${result.summary}

 Important Dates:
 ${formatList(result.importantDates)}

 Grading Breakdown:
 ${formatList(result.gradingBreakdown)}

 Required Materials:
 ${formatList(result.requiredMaterials)}

 Late Policy:
 ${result.latePolicy}

 Attendance Policy:
 ${result.attendancePolicy}

 Warnings:
 ${formatList(result.warnings)}
 `;
}

function App() {
  const [syllabusText, setSyllabusText] = useState("");
  const [result, setResult] = useState<SyllabusResult | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
  if (!isLoading) {
    setProgress(0);
    return;
  }

  const interval = setInterval(() => {
    setProgress((currentProgress) => {
      if (currentProgress >= 90) {
        return currentProgress;
      }

      return currentProgress + 10;
    });
  }, 500);

  return () => clearInterval(interval);
}, [isLoading]);

async function handleAnalyze() {
  setIsLoading(true);
  setProgress(5);
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
    setProgress(100);
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

function handleDownloadSummary() {
  if (!result) {
    return;
  }

  const downloadText = buildDownloadText(result);

  const blob = new Blob([downloadText], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${makeFileName(result.courseName)}-summary.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

  {isLoading && (
  <div className="progress-section">
    <p className="progress-text">Analyzing syllabus, please be patient✨✨✨</p>

    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
)}

      {result && (
        <section className="results">
          <div className="card">
            <div className="title-container">
            <h2>{result.courseName}</h2>

            <button
              type="button"
              className="download-button"
              onClick={handleDownloadSummary}
            >
              Download Summary
            </button>
            </div>

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