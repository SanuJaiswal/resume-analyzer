// Validation helpers for the resume analyzer form

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export const validateUrl = (url) => {
  if (!url || !url.trim()) return 'Please paste a job link.';
  if (!URL_REGEX.test(url.trim())) return 'That doesn\'t look like a valid URL. It should start with http:// or https://';
  return null;
};

export const validateAnalysisInput = ({ jdMode, jobDescription, resumeMode, resumeFile, resumeText }) => {
  // Job description validation
  if (jdMode === 'text') {
    if (!jobDescription || !jobDescription.trim()) {
      return { field: 'jd', message: 'Please paste the job description.' };
    }
    if (jobDescription.trim().length < 50) {
      return { field: 'jd', message: 'Job description is too short. Add at least a few sentences.' };
    }
    if (jobDescription.length > 8000) {
      return { field: 'jd', message: 'Job description is very long. Please trim to under 8,000 characters.' };
    }
  } else if (jdMode === 'url') {
    if (!jobDescription || !jobDescription.trim()) {
      return { field: 'jd', message: 'Please fetch a job from a URL first.' };
    }
  }

  // Resume validation
  if (resumeMode === 'file') {
    if (!resumeFile) {
      return { field: 'resume', message: 'Please upload your resume PDF.' };
    }
  } else if (resumeMode === 'text') {
    if (!resumeText || !resumeText.trim()) {
      return { field: 'resume', message: 'Please paste your resume text.' };
    }
    if (resumeText.trim().length < 100) {
      return { field: 'resume', message: 'Resume text is too short. Add your full resume content.' };
    }
    if (resumeText.length > 12000) {
      return { field: 'resume', message: 'Resume is very long. Please trim to under 12,000 characters.' };
    }
  }

  return null;
};

export const validatePdfFile = (file) => {
  if (!file) return 'No file selected.';
  if (file.type !== 'application/pdf') return 'Only PDF files are supported.';
  if (file.size > 5 * 1024 * 1024) return 'File too large. Max 5 MB.';
  if (file.size < 1024) return 'File seems empty or too small.';
  return null;
};
