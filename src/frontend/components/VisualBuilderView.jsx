import React, { useState, useEffect } from 'react';
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
      title: 'Part 1: Introduction & Reading',
      blocks: [
        { id: 'b-1', type: 'heading', level: 1, text: 'Welcome to the Lesson' },
        { id: 'b-2', type: 'text', text: 'Read the following story carefully and complete all interactive tasks below.' }
      ]
    }
  ]
};

export const VisualBuilderView = ({ initialLesson, onSaveLesson, onCancel }) => {
  const [lesson, setLesson] = useState(DEFAULT_LESSON);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const [aiModalTarget, setAiModalTarget] = useState(null);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(['listening']);
  const [matchingType, setMatchingType] = useState('synonym');
  const [flashcardType, setFlashcardType] = useState('russian');
  const [modalLevel, setModalLevel] = useState('B1');
  const [aiGenerating, setAiGenerating] = useState(false);

  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);

  useEffect(() => {
    if (initialLesson) {
      const normalized = { ...initialLesson };
      if (!normalized.pages || !Array.isArray(normalized.pages) || normalized.pages.length === 0) {
        if (normalized.blocks && Array.isArray(normalized.blocks)) {
          normalized.pages = [{ id: 'p1', title: 'Part 1: Lesson Content', blocks: normalized.blocks }];
        } else {
          normalized.pages = [{ id: 'p1', title: 'Part 1: Lesson Content', blocks: [] }];
        }
      }
      setLesson(normalized);
      setModalLevel(normalized.level || 'B1');
      setActivePageIndex(0);
    }
  }, [initialLesson]);

  const activePage = lesson.pages?.[activePageIndex] || lesson.pages?.[0] || { blocks: [] };

  const availableSourceBlocks = React.useMemo(() => {
    const list = [];
    lesson.pages?.forEach(p => {
      if (p && Array.isArray(p.blocks)) {
        p.blocks.forEach(b => {
          if (b && (b.type === 'text' || b.type === 'video' || b.type === 'audio' || b.type === 'grammar_card')) {
            list.push(b);
          }
        });
      }
    });
    return list;
  }, [lesson]);

  const extractLessonContext = (overrideBlockId) => {
    if (overrideBlockId) {
      const found = availableSourceBlocks.find(b => b.id === overrideBlockId);
      if (found) return found.text || found.transcript || found.explanation || JSON.stringify(found);
    }
    let contextText = '';
    lesson.pages?.forEach(page => {
      if (page && Array.isArray(page.blocks)) {
        page.blocks.forEach(b => {
          if (b && b.type === 'text' && b.text) contextText += b.text + '\n';
          if (b && b.type === 'video' && b.transcript) contextText += b.transcript + '\n';
          if (b && b.type === 'grammar_card' && b.explanation) contextText += `Grammar Rule (${b.title}): ${b.formula} - ${b.explanation}\n`;
        });
      }
    });
    return contextText || lesson.title || 'General English Practice';
  };

  const handleAddPage = () => {
    const newPage = { id: 'page-' + Date.now(), title: `Part ${(lesson.pages?.length || 0) + 1}`, blocks: [] };
    setLesson(prev => ({ ...prev, pages: [...(prev.pages || []), newPage] }));
    setActivePageIndex(lesson.pages?.length || 0);
  };

  const handleDeletePage = (idx) => {
    if ((lesson.pages?.length || 0) <= 1) return;
    const updatedPages = lesson.pages.filter((_, i) => i !== idx);
    setLesson(prev => ({ ...prev, pages: updatedPages }));
    setActivePageIndex(Math.max(0, idx - 1));
  };

  const handleUpdatePageTitle = (newTitle) => {
    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], title: newTitle };
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleAddBlock = (type) => {
    const newBlock = { id: 'b-' + Date.now(), type };
    if (type === 'heading') { newBlock.level = 2; newBlock.text = 'New Section'; }
    else if (type === 'text') { newBlock.text = 'Enter paragraph or story text here...'; }
    else if (type === 'video') { newBlock.title = 'Watch Video'; newBlock.url = ''; }
    else if (type === 'image') { newBlock.caption = ''; newBlock.images = []; }
    else if (type === 'grammar_card') { newBlock.title = 'Target Grammar Rule'; newBlock.formula = 'Formula'; newBlock.explanation = 'Rule explanation...'; newBlock.examples = ['Example sentence']; }
    else if (type === 'flashcards') { newBlock.title = 'Vocabulary'; newBlock.cards = [{ front: 'Word', back: 'Translation', example: 'Sample sentence' }]; }
    else if (type === 'multiple_choice') { newBlock.question = 'Question?'; newBlock.options = ['Option A', 'Option B']; newBlock.correct = 0; }
    else if (type === 'gap_fill') { newBlock.instruction = 'Fill the gap:'; newBlock.text = 'Sentence [answer] here.'; newBlock.answers = ['answer']; }
    else if (type === 'gap_fill_bank') { newBlock.instruction = 'Choose words:'; newBlock.text = 'Sentence [word].'; newBlock.distractors = ['fake']; }
    else if (type === 'matching') { newBlock.instruction = 'Match pairs:'; newBlock.pairs = [{ left: 'Word', right: 'Match' }]; }
    else if (type === 'open_input') { newBlock.prompt = 'Discussion question?'; newBlock.placeholder = 'Type here...'; }

    const updatedPages = [...(lesson.pages || [])];
    if (!updatedPages[activePageIndex]) {
      updatedPages[activePageIndex] = { id: 'p1', title: 'Part 1', blocks: [] };
    }
    updatedPages[activePageIndex].blocks.push(newBlock);
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleUpdateBlock = (blockIdx, updatedBlock) => {
    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks[blockIdx] = updatedBlock;
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleMoveBlock = (blockIdx, direction) => {
    const blocks = [...(activePage.blocks || [])];
    const targetIdx = blockIdx + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[blockIdx];
    blocks[blockIdx] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks = blocks;
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleDragStart = (idx) => {
    setDraggedBlockIdx(idx);
  };

  const handleDropOnBlock = (targetIdx) => {
    if (draggedBlockIdx === null || draggedBlockIdx === targetIdx) return;
    const blocks = [...(activePage.blocks || [])];
    const draggedItem = blocks[draggedBlockIdx];
    
    blocks.splice(draggedBlockIdx, 1);
    blocks.splice(targetIdx, 0, draggedItem);

    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks = blocks;
    setLesson(prev => ({ ...prev, pages: updatedPages }));
    setDraggedBlockIdx(null);
  };

  const handleDeleteBlock = (blockIdx) => {
    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks = updatedPages[activePageIndex].blocks.filter((_, i) => i !== blockIdx);
    setLesson(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleOpenAiModal = (block, blockIdx) => {
    setAiModalTarget({ block, blockIdx });
    // Default single task selection based on block type
    if (block.type === 'grammar_card') setSelectedTasks(['grammar_quiz']);
    else if (block.type === 'matching') setSelectedTasks(['matching']);
    else if (block.type === 'flashcards') setSelectedTasks(['flashcards']);
    else setSelectedTasks(['listening']);
  };

  const toggleTaskSelection = (taskKey) => {
    setSelectedTasks(prev => prev.includes(taskKey) ? prev.filter(t => t !== taskKey) : [...prev, taskKey]);
  };

  const handleExecuteBlockAi = async (explicitActions) => {
    if (!aiModalTarget) return;
    const actionsToRun = Array.isArray(explicitActions) && explicitActions.length > 0 ? explicitActions : selectedTasks;

    if (actionsToRun.length === 0) return alert('Select at least one task');
    setAiGenerating(true);

    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: actionsToRun,
          sourceBlock: aiModalTarget.block,
          sourceText: extractLessonContext(selectedSourceId),
          matchingType,
          flashcardType,
          level: modalLevel || lesson.level || 'B1'
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.newBlocks)) {
        const blocksWithIds = data.newBlocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
        const updatedPages = [...(lesson.pages || [])];
        const currentBlocks = updatedPages[activePageIndex].blocks;

        if ((actionsToRun.includes('fill_this_block') || actionsToRun.includes('expand_text') || actionsToRun.includes('shorten_text') || actionsToRun.includes('refine_level')) && blocksWithIds.length > 0) {
          currentBlocks[aiModalTarget.blockIdx] = { ...currentBlocks[aiModalTarget.blockIdx], ...blocksWithIds[0], id: aiModalTarget.block.id };
        } else {
          const insertIdx = aiModalTarget.blockIdx + 1;
          currentBlocks.splice(insertIdx, 0, ...blocksWithIds);
        }

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
      {/* HEADER BAR & METADATA INPUTS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧩</span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Visual Lego Lesson Builder</h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveLesson({ ...lesson, id: lesson.id || 'lesson-' + Date.now() })}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md transition cursor-pointer"
            >
              💾 Save Lesson
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Lesson Title</label>
            <input
              type="text"
              value={lesson.title || ''}
              onChange={e => setLesson(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 outline-none transition shadow-2xs"
              placeholder="e.g. Travel Vocabulary & Past Simple"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Level & Topic</label>
            <div className="flex gap-2">
              <select
                value={lesson.level || 'B1'}
                onChange={e => {
                  const newLvl = e.target.value;
                  setLesson(prev => ({ ...prev, level: newLvl }));
                  setModalLevel(newLvl);
                }}
                className="w-28 px-3 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 outline-none transition shadow-2xs cursor-pointer"
              >
                <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
              </select>
              <input
                type="text"
                value={lesson.topic || ''}
                onChange={e => setLesson(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 outline-none transition shadow-2xs"
                placeholder="Topic..."
              />
            </div>
          </div>
        </div>
      </div>

      <BuilderPagesBar
        pages={lesson.pages || []}
        activePageIndex={activePageIndex}
        setActivePageIndex={setActivePageIndex}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onUpdatePageTitle={handleUpdatePageTitle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <BuilderPalette onAddBlock={handleAddBlock} />

        <div className="lg:col-span-3 space-y-4">
          {(activePage.blocks || []).length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <span className="text-4xl block">🧩</span>
              <p className="font-bold text-slate-600">This page is currently empty.</p>
              <p className="text-slate-400 text-xs">Click any block from the left palette to add content!</p>
            </div>
          ) : (
            (activePage.blocks || []).map((block, idx) => (
              <div
                key={block.id || idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnBlock(idx)}
                className={`bg-white p-6 rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md relative group ${
                  draggedBlockIdx === idx ? 'opacity-40 border-dashed border-indigo-500 scale-98' : 'border-slate-200/90 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 font-bold px-1 text-base select-none"
                      title="Drag to reorder block"
                    >
                      ⣿
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                      {block?.type?.replace(/_/g, ' ') || 'block'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAiModal(block, idx)}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>✨ Generate / Fill with AI</span>
                    </button>
                    <button onClick={() => handleMoveBlock(idx, -1)} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer">▲</button>
                    <button onClick={() => handleMoveBlock(idx, 1)} disabled={idx === (activePage.blocks?.length || 1) - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer">▼</button>
                    <button onClick={() => handleDeleteBlock(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" title="Delete block">🗑️</button>
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
        availableSourceBlocks={availableSourceBlocks}
        selectedSourceId={selectedSourceId}
        setSelectedSourceId={setSelectedSourceId}
        selectedTasks={selectedTasks}
        toggleTaskSelection={toggleTaskSelection}
        matchingType={matchingType}
        setMatchingType={setMatchingType}
        flashcardType={flashcardType}
        setFlashcardType={setFlashcardType}
        modalLevel={modalLevel}
        setModalLevel={setModalLevel}
        onExecute={handleExecuteBlockAi}
        onClose={() => setAiModalTarget(null)}
        aiGenerating={aiGenerating}
      />
    </div>
  );
};
