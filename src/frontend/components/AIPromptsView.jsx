import React, { useState } from 'react';

const PROMPT_TEMPLATES = [
  {
    id: 1,
    category: 'Full PPP Lesson',
    title: '📖 Transform Textbook / PDF / Transcript into 5-Page Lesson',
    description: 'Convert any PDF page, article, or video transcript into a complete 5-page CELTA-style lesson with Lead-in, Gist, PPP Grammar, Practice, and Production.',
    prompt: `You are a world-class CELTA/DELTA ELT Methodologist.
Convert the following source material into a complete 5-Page Interactive Lesson in JSON format matching CEFR Level [A1/A2/B1/B2/C1].

STRICT METHODOLOGICAL PIPELINE:
- Page 1: Lead-in Discussion (open_input) + Vocabulary Flashcards (flashcards) + Core Reading Text/Script (text).
- Page 2: Gist Comprehension (multiple_choice) + Fact/Date Matching (matching) + 5 True/False Questions (multiple_choice).
- Page 3: Grammar Presentation Rule (grammar_card) + Collocation Matching (matching).
- Page 4: Word Bank Gap Fill (gap_fill_bank) + Transformation Gap Fill (gap_fill).
- Page 5: Speaking Discussion (open_input) + Creative Roleplay/Retelling (open_input) + Homework Practice (gap_fill).

STRICT RULES:
1. 100% Target Language Policy: All text, questions, and instructions MUST be in English (except optional Russian translations on flashcard backs).
2. Minimum 5-8 items per exercise block.
3. Return ONLY valid JSON format.

Source Text/Material:
[PASTE TEXT OR TRANSCRIPT HERE]`
  },
  {
    id: 2,
    category: 'Grammar & Vocabulary',
    title: '🎯 CEFR-Targeted Grammar & Vocabulary Drill Generator',
    description: 'Generate level-bound grammar cards and exercises based on the CEFR Grammar Matrix (A1 to C1).',
    prompt: `Create an interactive grammar & vocabulary practice unit for CEFR Level [B1] on the topic "[Target Topic, e.g. Conditionals or Business Travel]".

REQUIREMENTS:
1. Include a 'grammar_card' block with Formula, Explanation, and 3 Contextual Examples.
2. Include a 'matching' block with 8 target collocation/synonym pairs.
3. Include a 'gap_fill_bank' block with 6 sentences and 3 distractor words.
4. Include a 'gap_fill' block with 6 sentence transformations.
5. All exercises must strictly target CEFR Level [B1] grammar and vocabulary.

Return ONLY valid JSON format.`
  },
  {
    id: 3,
    category: 'Speaking & Video',
    title: '🎥 YouTube Video Transcript Exploitation Unit',
    description: 'Extract comprehension questions, key vocabulary, and debate prompts from any video transcript.',
    prompt: `Act as a TEFL Materials Writer. Exploit this video transcript for a 45-minute communicative lesson:

1. Extract 6 key B2-level idioms/phrases into 'flashcards' (word, translation, example sentence).
2. Create 5 'multiple_choice' listening comprehension questions with explanations.
3. Create 1 'gap_fill_bank' exercise using key lines from the transcript.
4. Create 3 'open_input' debate/speaking discussion questions.

Return ONLY valid JSON format.

Transcript:
[PASTE YOUTUBE TRANSCRIPT HERE]`
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
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">💡 Master AI Prompt Library for Teachers</h2>
        <p className="text-slate-500 text-sm mt-1">Copy these battle-tested prompts to generate structured CELTA-style lessons directly in ChatGPT, Claude, or Gemini.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {PROMPT_TEMPLATES.map((item) => (
          <div key={item.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-full uppercase tracking-wider">{item.category}</span>
              <button
                onClick={() => handleCopy(item.id, item.prompt)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === item.id ? '✓ Copied!' : '📋 Copy Prompt'}
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
            <p className="text-xs text-slate-500">{item.description}</p>
            <pre className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {item.prompt}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
