import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import html2pdf from 'html2pdf.js';

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [tailoredText, setTailoredText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return alert('Please upload a PDF file.');

    const reader = new FileReader();
    reader.onload = async () => {
      const pdfData = new Uint8Array(reader.result);
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(' ') + ' ';
      }

      setResumeText(fullText.trim());
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTailor = async () => {
    if (!resumeText || !jdText) return alert('Please upload resume and paste job description.');
    setUploading(true);

    const prompt = `Act like a professional resume writer. Given the user's resume and a job description, tailor the resume to maximize alignment with the job. Avoid generic advice. Use the Jake resume structure and tone. Return only the modified resume content.

Resume:
${resumeText}

Job Description:
${jdText}`;

    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
        }
      );

      setTailoredText(res.data.choices[0].message.content.trim());
    } catch (err) {
      console.error('🔥 ERROR tailoring resume:', err.response?.data || err.message || err);
      alert('Something went wrong while tailoring your resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    const opt = {
      margin: 0.3,
      filename: 'tailored_resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };
    html2pdf().from(document.getElementById('preview')).set(opt).save();
  };

  return (
    <div className="container">
      <h1>Resume Tailor (Free & Groq-Powered)</h1>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />
      <textarea
        placeholder="Paste Job Description here..."
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={6}
      />
      <button onClick={handleTailor} disabled={uploading}>
        {uploading ? 'Tailoring...' : 'Tailor Resume'}
      </button>

      {tailoredText && (
        <>
          <div id="preview" contentEditable className="preview-box">
            {tailoredText}
          </div>
          <button onClick={handleDownload}>Download as PDF</button>
        </>
      )}
    </div>
  );
}

export default App;