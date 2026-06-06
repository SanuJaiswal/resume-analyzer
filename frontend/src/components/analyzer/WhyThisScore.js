import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
} from 'lucide-react';

const CATEGORY_META = {
  technical_skills: { label: 'Technical Skills', accent: 'cyan' },
  experience: { label: 'Experience', accent: 'violet' },
  domain_fit: { label: 'Domain Fit', accent: 'emerald' },
  domain_knowledge: { label: 'Domain Fit', accent: 'emerald' }, // legacy
  education: { label: 'Education', accent: 'amber' },
  soft_skills: { label: 'Soft Skills', accent: 'rose' },
};

const ACCENT_MAP = {
  cyan: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500',
    softBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    ring: 'ring-cyan-500/30',
    border: 'border-cyan-500/40',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500',
    softBg: 'bg-violet-50 dark:bg-violet-900/20',
    ring: 'ring-violet-500/30',
    border: 'border-violet-500/40',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500',
    softBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ring: 'ring-emerald-500/30',
    border: 'border-emerald-500/40',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500',
    softBg: 'bg-amber-50 dark:bg-amber-900/20',
    ring: 'ring-amber-500/30',
    border: 'border-amber-500/40',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500',
    softBg: 'bg-rose-50 dark:bg-rose-900/20',
    ring: 'ring-rose-500/30',
    border: 'border-rose-500/40',
  },
};

const scoreColor = (s) => {
  if (s >= 80) return 'text-emerald-500';
  if (s >= 60) return 'text-cyan-500';
  if (s >= 40) return 'text-amber-500';
  return 'text-red-500';
};

const scoreBarColor = (s) => {
  if (s >= 80) return 'bg-emerald-500';
  if (s >= 60) return 'bg-cyan-500';
  if (s >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

/**
 * Normalize a category value to the new shape.
 * Accepts either:
 *   - number (legacy): becomes { score, explanation: '', matched_evidence: [], missing_evidence: [] }
 *   - object (new): passed through with defaults filled.
 */
const normalize = (val) => {
  if (typeof val === 'number') {
    return {
      score: val,
      explanation: '',
      matched_evidence: [],
      missing_evidence: [],
    };
  }
  if (val && typeof val === 'object') {
    return {
      score: typeof val.score === 'number' ? val.score : 0,
      explanation: val.explanation || '',
      matched_evidence: Array.isArray(val.matched_evidence) ? val.matched_evidence : [],
      missing_evidence: Array.isArray(val.missing_evidence) ? val.missing_evidence : [],
    };
  }
  return { score: 0, explanation: '', matched_evidence: [], missing_evidence: [] };
};

const CATEGORY_ORDER = [
  'technical_skills',
  'experience',
  'domain_fit',
  'education',
  'soft_skills',
];

const CategoryAccordion = ({ categoryKey, value, isOpen, onToggle, index }) => {
  const meta = CATEGORY_META[categoryKey] || { label: categoryKey, accent: 'cyan' };
  const accent = ACCENT_MAP[meta.accent];
  const data = normalize(value);

  const isRich = Boolean(data.explanation) || data.matched_evidence.length > 0 || data.missing_evidence.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition ${
        isOpen ? `ring-2 ${accent.ring}` : ''
      }`}
      data-testid={`why-score-row-${categoryKey}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
        data-testid={`why-score-toggle-${categoryKey}`}
        aria-expanded={isOpen}
      >
        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] uppercase tracking-wider font-bold ${accent.text}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              {meta.label}
            </h4>
            {!isRich && (
              <span
                className="ml-1 text-[10px] uppercase tracking-wider text-slate-400"
                title="No detailed explanation provided"
              >
                · legacy
              </span>
            )}
          </div>

          {/* Inline score bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${scoreBarColor(data.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${data.score}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
            <span className={`text-lg font-bold tabular-nums ${scoreColor(data.score)}`}>
              {data.score}
            </span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-slate-200 dark:border-slate-800"
          >
            <div className="p-4 sm:p-5 space-y-5" data-testid={`why-score-body-${categoryKey}`}>
              {/* Explanation */}
              {data.explanation ? (
                <div className={`rounded-lg ${accent.softBg} border ${accent.border} p-4`}>
                  <div className="flex items-start gap-2">
                    <FileSearch className={`h-4 w-4 mt-0.5 flex-shrink-0 ${accent.text}`} />
                    <div>
                      <p className={`text-[11px] uppercase tracking-wider font-semibold ${accent.text} mb-1`}>
                        Reasoning
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {data.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm italic text-slate-500 dark:text-slate-400">
                  No detailed reasoning available for this category.
                </p>
              )}

              {/* Evidence grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Matched evidence */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <h5 className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                      Matched Evidence
                    </h5>
                    <span className="ml-auto text-xs text-slate-400">
                      {data.matched_evidence.length}
                    </span>
                  </div>
                  {data.matched_evidence.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No direct matches surfaced.</p>
                  ) : (
                    <ul className="space-y-3">
                      {data.matched_evidence.map((ev, i) => (
                        <li
                          key={i}
                          className="rounded-lg border-l-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/10 p-3"
                          data-testid={`matched-evidence-${categoryKey}-${i}`}
                        >
                          {ev.resume_text && (
                            <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-snug">
                              "{ev.resume_text}"
                            </p>
                          )}
                          {ev.jd_requirement && (
                            <p className="mt-1.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              JD: <span className="normal-case tracking-normal text-slate-600 dark:text-slate-300">{ev.jd_requirement}</span>
                            </p>
                          )}
                          {ev.reason && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-snug">
                              {ev.reason}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Missing evidence */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h5 className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
                      Missing Evidence
                    </h5>
                    <span className="ml-auto text-xs text-slate-400">
                      {data.missing_evidence.length}
                    </span>
                  </div>
                  {data.missing_evidence.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No critical gaps in this category.</p>
                  ) : (
                    <ul className="space-y-3">
                      {data.missing_evidence.map((ev, i) => (
                        <li
                          key={i}
                          className="rounded-lg border-l-2 border-amber-500 bg-amber-50/40 dark:bg-amber-900/10 p-3"
                          data-testid={`missing-evidence-${categoryKey}-${i}`}
                        >
                          {ev.jd_requirement && (
                            <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-snug">
                              {ev.jd_requirement}
                            </p>
                          )}
                          {ev.reason && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-snug">
                              {ev.reason}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const WhyThisScore = ({ categoryScores }) => {
  const [openKey, setOpenKey] = useState('technical_skills');

  if (!categoryScores) return null;

  // Use canonical order; fall back to any extra keys appended.
  const keys = [
    ...CATEGORY_ORDER.filter((k) => k in categoryScores),
    ...Object.keys(categoryScores).filter((k) => !CATEGORY_ORDER.includes(k)),
  ];

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
      data-testid="why-this-score-section"
    >
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Scale className="h-5 w-5 text-cyan-500" />
          Why This Score?
        </h3>
        <span className="text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
          Explainable AI
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Every category score is backed by specific evidence from your resume and the job description. Click any row to see the reasoning.
      </p>

      <div className="space-y-3">
        {keys.map((key, idx) => (
          <CategoryAccordion
            key={key}
            categoryKey={key}
            value={categoryScores[key]}
            index={idx}
            isOpen={openKey === key}
            onToggle={() => setOpenKey(openKey === key ? null : key)}
          />
        ))}
      </div>
    </div>
  );
};

export default WhyThisScore;
