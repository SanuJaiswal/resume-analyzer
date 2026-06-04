import React from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const ScoreRing = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? '#10b981' : score >= 60 ? '#06b6d4' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="absolute -rotate-90" width="176" height="176">
        <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-slate-200 dark:text-slate-800" />
        <motion.circle
          cx="88"
          cy="88"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.div
          className="text-5xl font-bold text-slate-900 dark:text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Match Score</div>
      </div>
    </div>
  );
};

const CATEGORY_LABELS = {
  technical_skills: 'Technical Skills',
  experience: 'Experience',
  domain_knowledge: 'Domain Fit',
  soft_skills: 'Soft Skills',
  education: 'Education',
};

export const CategoryRadarChart = ({ categoryScores }) => {
  if (!categoryScores) return null;
  const data = Object.entries(categoryScores).map(([key, value]) => ({
    category: CATEGORY_LABELS[key] || key,
    score: value,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
        Category Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
          <PolarAngleAxis dataKey="category" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-600 dark:text-slate-400" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.35}
            strokeWidth={2}
            isAnimationActive
            animationDuration={1200}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #06b6d4',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(v) => [`${v}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SkillsBarChart = ({ matched = [], missing = [] }) => {
  const data = [
    { name: 'Matched', count: matched.length, fill: '#10b981' },
    { name: 'Missing', count: missing.length, fill: '#ef4444' },
  ];
  const total = matched.length + missing.length;
  const pct = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Skills Coverage
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{pct}%</div>
          <div className="text-xs text-slate-500">covered</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 600 }} className="text-slate-700 dark:text-slate-300" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #06b6d4',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(v) => [`${v} skills`, '']}
            cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={1000}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
