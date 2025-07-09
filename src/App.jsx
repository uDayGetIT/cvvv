
import React, { useState } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import html2pdf from 'html2pdf.js';
import ResumePreview from './ResumePreview';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const App = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }

    setResumeText(text);
  };

  const handleTailor = async () => {
    if (!resumeText || !jobDesc) return alert('Resume and Job Description are required.');
    setLoading(true);

    const prompt = `
You're an ATS resume assistant. Given a resume and a job description, tailor the resume to match the job description with a high ATS score (80–90%). Return result in this JSON format:

{
  "name": "",
  "contact": {
    "email": "",
    "phone": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "skills": [""],
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": [""]
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "location": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "projects": [
    {
      "title": "",
      "technologies": "",
      "bullets": [""]
    }
  ]
}

Resume:
${resumeText}

Job Description:
${jobDesc}
    `;

    try {
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2048,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        }
      });

      const extracted = res.data.choices[0].message.content.trim();
      const jsonStart = extracted.indexOf('{');
      const jsonEnd = extracted.lastIndexOf('}');
      const jsonString = extracted.slice(jsonStart, jsonEnd + 1);
      setJsonData(JSON.parse(jsonString));
    } catch (err) {
      console.error('Error tailoring resume:', err);
      alert('Something went wrong while tailoring your resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    html2pdf().from(element).save('Tailored_Resume.pdf');
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      <h1>AI Resume Tailor</h1>
      <input type="file" accept=".pdf" onChange={handlePDFUpload} />
      <br /><br />
      <textarea
        placeholder="Or paste your resume text..."
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        rows={10}
        style={{ width: '100%' }}
      />
      <br /><br />
      <textarea
        placeholder="Paste Job Description here..."
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        rows={6}
        style={{ width: '100%' }}
      />
      <br /><br />
      <button onClick={handleTailor} disabled={loading}>
        {loading ? 'Tailoring...' : 'Tailor Resume'}
      </button>
      {' '}
      <button onClick={handleDownload} disabled={!jsonData}>
        Download PDF
      </button>
      <br /><br />
      {jsonData && <ResumePreview data={jsonData} />}
    </div>
  );
};

export default App;
