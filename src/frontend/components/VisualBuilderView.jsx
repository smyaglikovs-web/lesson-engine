import React, { useState } from 'react';
import { BuilderPagesBar } from './builder/BuilderPagesBar.jsx';
import { BuilderPalette } from './builder/BuilderPalette.jsx';
import { EditableBlockCard } from './builder/EditableBlockCard.jsx';
import { BuilderAiModal } from './builder/BuilderAiModal.jsx';

const DEFAULT_LESSON = {
  title: 'New Interactive English Lesson',
  level: 'B1',
  topic: 'General English',
  description: 'Interactive lesson created with Visual Builder',
  pages: [
    {
      id: 'page-1',
      title: 'Part 1: Introduction & Practice',
      blocks: [
        { id: 'b-1', type: 'heading', level: 1, text: 'Welcome to the Lesson' },
        { id: 'b-2', type: 'text', text: 'Read the following instructions carefully and complete all tasks.' }
      ]
    }
  ]
};

export const VisualBuilderView = ({ onSaveLesson, onCancel }) => {
  const [lesson, setLesson] = useState(DEFAULT_LESSON);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const [aiModalTarget, setAiModalTarget] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(['listening', 'flashcards', 'quiz']);
  const [aiGenerating, setAiGenerating] = useState(false);

  const activePage = lesson.pages[activePageIndex] || lesson.pages[0];

  const handleAddPage = () => {
    const newPage = { id: 'page-' + Date.now(), title: `Part ${lesson.pages.length + 1}`, blocks: [] };
    setLesson(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageIndex(lesson.pages.length);
  };

  const handleDeletePage = (idx) => {
    if (lesson.pages.length <= 1) return;
    const updatedPages = lesson.pages.filter((_, i) => i !== idx);
    setLesson(prev => ({ ...prev, pages: updatedPages }));
    setActivePageIndex(Math.max(0, idx - 1));
  };

  const handleUpdatePageTitle = (newTitle) => {
    const updatedPages = [...lesson.pages];
    updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], title: newTitle };
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleAddBlock = (type) => {
    const newBlock = { id: 'b-' + Date.now(), type };
    if (type === 'heading') { newBlock.level = 2; newBlock.text = 'New Section'; }
    else if (type === 'text') { newBlock.text = 'Enter paragraph text here...'; }
    else if (type === 'video') { newBlock.title = 'Watch Video'; newBlock.url = ''; }
    else if (type === 'image') { newBlock.caption = ''; newBlock.images = []; }
    else if (type === 'flashcards') { newBlock.title = 'Vocabulary'; newBlock.cards = [{ front: 'Word', back: 'Translation', example: 'Sample sentence' }]; }
    else if (type === 'multiple_choice') { newBlock.question = 'Question?'; newBlock.options = ['Option A', 'Option B']; newBlock.correct = 0; }
    else if (type === 'gap_fill') { newBlock.instruction = 'Fill the gap:'; newBlock.text = 'Sentence [answer] here.'; newBlock.answers = ['answer']; }
    else if (type === 'gap_fill_bank') { newBlock.instruction = 'Choose words:'; newBlock.text = 'Sentence [word].'; newBlock.distractors = ['fake']; }
    else if (type === 'matching') { newBlock.instruction = 'Match pairs:'; newBlock.pairs = [{ left: 'Word', right: 'Match' }]; }
    else if (type === 'open_input') { newBlock.prompt = 'Discussion question?'; newBlock.placeholder = 'Type here...'; }

    const updatedPages = [...lesson.pages];
    updatedPages[activePageIndex].blocks.push(newBlock);
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleUpdateBlock = (blockIdx, updatedBlock) => {
    const updatedPages = [...lesson.pages];
    updatedPages[activePageIndex].blocks[blockIdx] = updatedBlock;
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleMoveBlock = (blockIdx, direction) => {
    const blocks = [...activePage.blocks];
    const targetIdx = blockIdx + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[blockIdx];
    blocks[blockIdx] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updatedPages = [...lesson.pages];
    updatedPages[activePageIndex].blocks = blocks;
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleDeleteBlock = (blockIdx) => {
    const updatedPages = [...lesson.pages];
    updatedPages[activePageIndex].blocks = updatedPages[activePageIndex].blocks.filter((_, i) => i !== blockIdx);
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleOpenAiModal = (block, blockIdx) => {
    setAiModalTarget({ block, blockIdx });
  };

  const toggleTaskSelection = (taskKey) => {
    setSelectedTasks(prev => prev.includes(taskKey) ? prev.filter(t => t !== taskKey) : [...prev, taskKey]);
  };

  const handleExecuteBlockAi = async () => {
    if (!aiModalTarget) return;
    setAiGenerating(true);

    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: selectedTasks,
          sourceBlock: aiModalTarget.block,
          level: lesson.level
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.newBlocks)) {
        const blocksWithIds = data.newBlocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
        const updatedPages = [...lesson.pages];
        const currentBlocks = updatedPages[activePageIndex].blocks;
        const insertIdx = aiModalTarget.blockIdx + 1;
        currentBlocks.splice(insertIdx, 0, ...blocksWithIds);

        setLesson(prev => ({ ...prev, pages: updatedPages }));
        setAiModalTarget(null);
      } else {
        alert('AI Transformation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error connecting to AI service');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">🧩 Visual Lego Lesson Builder</h2>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
            <button onClick={() => onSaveLesson({ ...lesson, id: lesson.id || 'lesson-' + Date.now() })} className="btn-success">
              💾 Save Lesson
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lesson Title</label>
            <input
              type="text"
              value={lesson.title}
              onChange={e => setLesson(prev => ({ ...prev, title: e.target.value }))}
              className="input-modern font-bold text-base"
              placeholder="e.g. Travel Vocabulary & Past Simple"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Level & Topic</label>
            <div className="flex gap-2">
              <select
                value={lesson.level}
                onChange={e => setLesson(prev => ({ ...prev, level: e.target.value }))}
                className="input-modern w-28 font-bold"
              >
                <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
              </select>
              <input
                type="text"
                value={lesson.topic}
                onChange={e => setLesson(prev => ({ ...prev, topic: e.target.value }))}
                className="input-modern"
                placeholder="Topic..."
              />
            </div>
          </div>
        </div>
      </div>

      <BuilderPagesBar
        pages={lesson.pages}
        activePageIndex={activePageIndex}
        setActivePageIndex={setActivePageIndex}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onUpdatePageTitle={handleUpdatePageTitle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <BuilderPalette onAddBlock={handleAddBlock} />

        <div className="lg:col-span-3 space-y-4">
          {activePage.blocks.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <span className="text-4xl block">🧩</span>
              <p className="font-bold text-slate-600">This page is currently empty.</p>
              <p className="text-slate-400 text-xs">Click any block from the left palette to add content!</p>
            </div>
          ) : (
            activePage.blocks.map((block, idx) => (
              <div key={block.id || idx} className="card-editable group">
                <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                      {block.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(block.type === 'video' || block.type === 'text' || block.type === 'flashcards') && (
                      <button onClick={() => handleOpenAiModal(block, idx)} className="btn-ai">
                        <span>✨ Generate Exercises with AI</span>
                      </button>
                    )}
                    <button onClick={() => handleMoveBlock(idx, -1)} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">▲</button>
                    <button onClick={() => handleMoveBlock(idx, 1)} disabled={idx === activePage.blocks.length - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">▼</button>
                    <button onClick={() => handleDeleteBlock(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">🗑️</button>
                  </div>
                </div>

                <EditableBlockCard block={block} onChange={(updated) => handleUpdateBlock(idx, updated)} />
              </div>
            ))
          )}
        </div>
      </div>

      <BuilderAiModal
        aiModalTarget={aiModalTarget}
        selectedTasks={selectedTasks}
        toggleTaskSelection={toggleTaskSelection}
        onExecute={handleExecuteBlockAi}
        onClose={() => setAiModalTarget(null)}
        aiGenerating={aiGenerating}
      />
    </div>
  );
};
