import React, { useState } from 'react';

const PROMPT_TEMPLATES = [
  {
    id: 1,
    category: 'Grammar',
    title: 'Interactive Grammar Story (B1-B2)',
    prompt: `Create a B1 level reading passage (approx 200 words) using Present Perfect and Past Simple naturally. Then generate:
1. 4 Multiple Choice comprehension questions.
2. 5 Gap-fill sentences targeting key verbs.
3. 3 Discussion questions using the target grammar.`
  },
  {
    id: 2,
    category: 'Vocabulary',
    title: 'Topic Word-Bank & Matching Drills',
    prompt: `Generate 8 essential vocabulary words for the topic "Job Interviews & Career Development" for B2 level. 
Format as JSON with fields: front (word), back (Russian translation), example (example sentence).`
  },
  {
    id: 3,
    category: 'Speaking & Video',
    title: 'TED-Talk Listening & Discussion',
    prompt: `Create a comprehensive video lesson plan for a short video about "Time Management and Productivity":
1. 3 Warm-up discussion questions.
2. Key vocabulary flashcards (6 words with translations).
3. 4 Multiple choice listening comprehension questions.`
  }
];

export const AIPromptsView = () => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">💡 AI Prompt Library for Teachers</h2>
        <p className="text-slate-500 text-sm mt-1">Copy these battle-tested prompts to quickly generate lesson content with Cloudflare Llama AI.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {PROMPT_TEMPLATES.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <span className="badge-indigo">{item.category}</span>
              <button
                onClick={() => handleCopy(item.id, item.prompt)}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                {copiedId === item.id ? '✓ Copied!' : '📋 Copy Prompt'}
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
            <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
              {item.prompt}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
