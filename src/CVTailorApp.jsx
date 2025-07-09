// src/CVTailorApp.jsx
import React, { useState, useEffect } from 'react';
import {
  Upload, Download, Sparkles, FileText, Briefcase,
  AlertCircle, CheckCircle, Target, TrendingUp, Award, Eye
} from 'lucide-react';

const CVTailorApp = () => {
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredCV, setTailoredCV] = useState('');
  const [editedCV, setEditedCV] = useState('');
  const [atsScore, setAtsScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  const GROQ_API_KEY = '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';

  // PDF.js loader
  useEffect(() => {
    const loadPDFLib = async () => {
      if (window.pdfjsLib) return setPdfLibLoaded(true);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setPdfLibLoaded(true);
        }
      };
      document.head.appendChild(script);
    };
    loadPDFLib();
  }, []);

  const extractPDFText = async (file) => {
    const buffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText.trim();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setCvFile(file);
    setError('');
    setCvText('');
    setProcessingStep('Processing your file...');

    try {
      if (file.type === 'application/pdf') {
        if (!pdfLibLoaded) throw new Error('PDF.js not loaded');
        setProcessingStep('Extracting text from PDF...');
        const text = await extractPDFText(file);
        setCvText(text);
        setProcessingStep('');
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setCvText(text);
        setProcessingStep('');
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (err) {
      setError(err.message);
      setProcessingStep('');
    }
  };

  const tailorCV = async () => {
    if (!cvText.trim() || !jobDescription.trim()) {
      return setError('Please provide both CV and job description');
    }

    setLoading(true);
    setError('');
    setProcessingStep('Optimizing resume...');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a CV optimization AI. Optimize for ATS based on job description.'
            },
            {
              role: 'user',
              content: `CV: ${cvText}\n\nJob: ${jobDescription}`
            }
          ]
        })
      });

      const data = await response.json();
      const result = data.choices[0].message.content;
      setTailoredCV(result);
      setEditedCV(result);
      setProcessingStep('Calculating ATS Score...');

      // Reuse same API for score
      const scoreResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'Give ATS score for given CV and JD in JSON format only.'
            },
            {
              role: 'user',
              content: `CV: ${result}\n\nJD: ${jobDescription}`
            }
          ]
        })
      });

      const scoreData = await scoreResponse.json();
      const scoreText = scoreData.choices[0].message.content;
      const scoreJSON = JSON.parse(scoreText.match(/\{[\s\S]*\}/)[0]);
      setAtsScore(scoreJSON);

    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const downloadCV = () => {
    const blob = new Blob([editedCV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Target /> ATS CV Tailor
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Upload CV</h2>
          <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} />
          {processingStep && <p className="text-sm text-blue-600 mt-2">{processingStep}</p>}
          {cvFile && <p className="text-sm text-green-600 mt-2">Uploaded: {cvFile.name}</p>}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Job Description</h2>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            className="w-full p-2 border rounded"
            placeholder="Paste job description here"
          ></textarea>
          <button
            onClick={tailorCV}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Optimizing...' : 'Tailor My Resume'}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {atsScore && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">ATS Score: <span className={getScoreColor(atsScore.score)}>{atsScore.score}</span></h2>
          <ul className="text-sm list-disc ml-5">
            {atsScore.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {tailoredCV && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Award className="text-green-600" /> Optimized Resume (Editable Preview)
          </h2>
          <textarea
            value={editedCV}
            onChange={(e) => setEditedCV(e.target.value)}
            rows={20}
            className="w-full border p-3 rounded font-mono text-sm whitespace-pre-wrap"
          ></textarea>
          <button
            onClick={downloadCV}
            className="mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            <Download className="inline mr-1" /> Download Resume
          </button>
        </div>
      )}
    </div>
  );
};

export default CVTailorApp;
