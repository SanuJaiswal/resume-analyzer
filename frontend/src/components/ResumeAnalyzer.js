import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
  Lightbulb,
  Wand2,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Download,
  Trash2,
  History,
  RotateCw,
  Zap,
  Moon,
  Sun,
  Github,
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { ScoreRing, CategoryRadarChart, SkillsBarChart } from './analyzer/AnalyzerCharts';
import WhyThisScore from './analyzer/WhyThisScore';
import { validateUrl, validateAnalysisInput, validatePdfFile } from './analyzer/validators';
import { SAMPLE_RESUME, SAMPLE_JD } from '../data/sampleAnalyzerData';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ResumeAnalyzer = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { history, save, clear, remove } = useAnalysisHistory();
  const fileInputRef = useRef(null);

  // Input modes
  const [resumeMode, setResumeMode] = useState('file'); // 'file' | 'text'
  const [jdMode, setJdMode] = useState('url'); // 'url' | 'text'

  // Form state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [urlFetching, setUrlFetching] = useState(false);
  const [result, setResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // ---------- handlers ----------

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validatePdfFile(file);
    if (err) {
      toast({ title: 'Invalid file', description: err, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setResumeFile(file);
    toast({ title: 'Resume ready', description: file.name });
  };

  const handleFetchJobUrl = async () => {
    const err = validateUrl(jobUrl);
    if (err) {
      toast({ title: 'Invalid URL', description: err, variant: 'destructive' });
      return;
    }
    setUrlFetching(true);
    setJobDescription('');
    try {
      const res = await axios.post(`${API}/resume/fetch-job`, { url: jobUrl }, { timeout: 25000 });
      setJobDescription(res.data.job_description);
      toast({ title: 'Job fetched', description: `${res.data.char_count.toLocaleString()} characters extracted.` });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Could not fetch the URL. Try pasting the description manually.';
      toast({ title: 'Fetch failed', description: msg, variant: 'destructive' });
    } finally {
      setUrlFetching(false);
    }
  };

  const loadSampleData = () => {
    setResumeMode('text');
    setJdMode('text');
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
    setResumeFile(null);
    setJobUrl('');
    toast({ title: 'Sample loaded', description: 'Click Analyze Match to see how it works.' });
  };

  const resetForm = () => {
    setResumeFile(null);
    setResumeText('');
    setJobUrl('');
    setJobDescription('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    const validationError = validateAnalysisInput({
      jdMode,
      jobDescription,
      resumeMode,
      resumeFile,
      resumeText,
    });
    if (validationError) {
      toast({ title: 'Missing info', description: validationError.message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('job_description', jobDescription);
      if (resumeMode === 'file') formData.append('resume_file', resumeFile);
      else formData.append('resume_text', resumeText);

      const res = await axios.post(`${API}/resume/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      setResult(res.data);
      save({
        result: res.data,
        jobPreview: jobDescription.slice(0, 120),
      });
      toast({ title: 'Analysis complete', description: `Match score: ${res.data.match_score}/100` });
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err) {
      let msg = 'Something went wrong. Please try again.';
      if (err.code === 'ECONNABORTED') msg = 'Analysis timed out. The job description might be too long.';
      else if (err?.response?.status === 429) msg = 'Too many requests. Please wait a moment and try again.';
      else if (err?.response?.data?.detail) msg = err.response.data.detail;
      else if (!err?.response) msg = 'Network error. Check your connection.';
      toast({ title: 'Analysis failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Analysis saved as JSON.' });
  };

  const loadFromHistory = (entry) => {
    setResult(entry.result);
    setShowHistory(false);
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ---------- render ----------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Resume Analyzer</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/SanuJaiswal"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition px-3 py-1.5 rounded-md"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowHistory((s) => !s)} className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
                <Badge variant="secondary" className="ml-1">{history.length}</Badge>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            AI-Powered · GPT-4o
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Resume Analyzer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Drop in your resume + a job link or description. Get an instant match score, skill gap analysis, and AI-rewritten bullet points.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button variant="outline" size="sm" onClick={loadSampleData} className="gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Try with sample data
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm} className="gap-2">
              <RotateCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </motion.div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-500" />
                  Recent Analyses
                </h3>
                <Button variant="ghost" size="sm" onClick={clear} className="text-red-500 hover:text-red-600 gap-1">
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </Button>
              </div>
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition cursor-pointer group"
                    onClick={() => loadFromHistory(h)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${
                          h.score >= 80 ? 'text-emerald-500'
                            : h.score >= 60 ? 'text-cyan-500'
                            : h.score >= 40 ? 'text-amber-500'
                            : 'text-red-500'
                        }`}>{h.score}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{h.verdict}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{h.jobPreview}...</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition"
                      onClick={(e) => { e.stopPropagation(); remove(h.id); }}
                    >
                      <XCircle className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <motion.div
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="grid lg:grid-cols-2 gap-6">
            {/* RESUME */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-cyan-500" />
                  Your Resume
                </label>
                <ModeToggle value={resumeMode} onChange={setResumeMode} options={[
                  { value: 'file', label: 'PDF' },
                  { value: 'text', label: 'Text' },
                ]} />
              </div>

              {resumeMode === 'file' ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {resumeFile ? (
                    <>
                      <CheckCircle2 className="h-10 w-10 text-cyan-500 mb-3" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-white px-4 text-center truncate max-w-full">{resumeFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(resumeFile.size / 1024).toFixed(0)} KB · Click to change</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-slate-400 group-hover:text-cyan-500 mb-3 transition" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click to upload PDF</p>
                      <p className="text-xs text-slate-500 mt-1">Max 5 MB</p>
                    </>
                  )}
                </button>
              ) : (
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your full resume text here..."
                  className="h-64 resize-none"
                />
              )}
              <CharCount value={resumeMode === 'text' ? resumeText : ''} min={100} max={12000} show={resumeMode === 'text'} />
            </div>

            {/* JOB DESCRIPTION */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                  <Target className="h-4 w-4 mr-2 text-cyan-500" />
                  Job Description
                </label>
                <ModeToggle value={jdMode} onChange={setJdMode} options={[
                  { value: 'url', label: 'URL' },
                  { value: 'text', label: 'Text' },
                ]} />
              </div>

              {jdMode === 'url' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://example.com/job-posting"
                        className="pl-9"
                      />
                    </div>
                    <Button onClick={handleFetchJobUrl} disabled={urlFetching} variant="secondary">
                      {urlFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                    </Button>
                  </div>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Fetched description will appear here. You can edit it before analyzing."
                    className="h-44 resize-none text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    LinkedIn and some sites block scraping. If fetch fails, switch to Text mode and paste manually.
                  </p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="h-64 resize-none"
                  />
                  <CharCount value={jobDescription} min={50} max={8000} show />
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={loading}
            size="lg"
            className="w-full mt-6 bg-slate-900 hover:bg-cyan-600 dark:bg-slate-100 dark:hover:bg-cyan-400 dark:text-slate-900 transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Analyze Match
              </>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">
              This usually takes 10-20 seconds. Please don't refresh the page.
            </p>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              id="result-section"
              className="mt-12 space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Score + Verdict */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ScoreRing score={result.match_score} />
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                      AI Verdict
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                      {result.verdict}
                    </h2>
                    <div className="flex gap-2 justify-center md:justify-start">
                      <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              {result.category_scores && (
                <div className="grid md:grid-cols-2 gap-6">
                  <CategoryRadarChart categoryScores={result.category_scores} />
                  <SkillsBarChart matched={result.matched_skills} missing={result.missing_skills} />
                </div>
              )}

              {/* Why This Score? — Explainable AI */}
              {result.category_scores && (
                <WhyThisScore categoryScores={result.category_scores} />
              )}

              {/* Skills Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <SkillCard title="Matched Skills" skills={result.matched_skills} variant="success" icon={CheckCircle2} />
                <SkillCard title="Missing Skills" skills={result.missing_skills} variant="danger" icon={XCircle} />
              </div>

              {/* Strengths & Gaps */}
              <div className="grid md:grid-cols-2 gap-6">
                <BulletCard title="Your Strengths" items={result.strengths} icon={TrendingUp} color="cyan" />
                <BulletCard title="Gaps to Address" items={result.gaps} icon={AlertCircle} color="amber" />
              </div>

              {/* Suggestions */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-cyan-50 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-cyan-500" />
                  Actionable Suggestions
                </h3>
                <ul className="space-y-3">
                  {(result.suggestions || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improved Bullets */}
              {result.improved_bullets?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Wand2 className="h-5 w-5 mr-2 text-cyan-500" />
                    AI-Rewritten Bullets
                  </h3>
                  <div className="space-y-5">
                    {result.improved_bullets.map((b, i) => (
                      <div key={i} className="border-l-4 border-cyan-500 pl-4">
                        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Original</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-through mb-3">{b.original}</p>
                        <p className="text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Improved</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{b.improved}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// ---------- small UI pieces ----------

const ModeToggle = ({ value, onChange, options }) => (
  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1 rounded-md font-medium transition ${
          value === opt.value
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
            : 'text-slate-500'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const CharCount = ({ value, min, max, show }) => {
  if (!show) return null;
  const len = value?.length || 0;
  const ok = len >= min && len <= max;
  return (
    <p className={`text-xs mt-2 ${ok ? 'text-slate-400' : 'text-amber-500'}`}>
      {len.toLocaleString()} / {max.toLocaleString()} {len < min && `· min ${min}`}
    </p>
  );
};

const SkillCard = ({ title, skills = [], variant, icon: Icon }) => {
  const styles = variant === 'success'
    ? { iconColor: 'text-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200' }
    : { iconColor: 'text-red-500', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200' };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
        <Icon className={`h-5 w-5 mr-2 ${styles.iconColor}`} />
        {title}
        <Badge variant="secondary" className="ml-auto">{skills.length}</Badge>
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <span className="text-sm text-slate-500 dark:text-slate-400 italic">None identified</span>
        ) : (
          skills.map((s, i) => (
            <Badge key={i} className={styles.badge}>{s}</Badge>
          ))
        )}
      </div>
    </div>
  );
};

const BulletCard = ({ title, items = [], icon: Icon, color }) => {
  const colorClass = color === 'cyan' ? 'text-cyan-500' : 'text-amber-500';
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
        <Icon className={`h-5 w-5 mr-2 ${colorClass}`} />
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((s, i) => (
          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
            <span className={`${colorClass} mr-2 mt-0.5`}>▸</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResumeAnalyzer;
