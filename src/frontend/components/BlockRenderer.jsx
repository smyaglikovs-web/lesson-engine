import React from 'react';
import { BlockHeading, BlockText, BlockImage, BlockVideo, BlockAudio, BlockGrammarCard } from './BlockMedia.jsx';
import { BlockMultipleChoice } from './BlockMultipleChoice.jsx';
import { BlockMatching } from './BlockMatching.jsx';
import { BlockGapFill } from './BlockGapFill.jsx';
import { BlockGapFillBank } from './BlockGapFillBank.jsx';
import { BlockOpenInput } from './BlockOpenInput.jsx';
import { BlockFlashcards } from './BlockFlashcards.jsx';
import { BlockReorder } from './BlockReorder.jsx';
import { BlockCategorization } from './BlockCategorization.jsx';

export const BlockRenderer = ({ block, value, onChange, isTeacher, onEditMedia }) => {
  switch (block.type) {
    case 'heading': return <BlockHeading block={block} />;
    case 'text': return <BlockText block={block} />;
    case 'image': return <BlockImage block={block} onEditMedia={onEditMedia} />;
    case 'video': return <BlockVideo block={block} onEditMedia={onEditMedia} />;
    case 'multiple_choice': return <BlockMultipleChoice block={block} value={value} onChange={onChange} />;
    case 'gap_fill': return <BlockGapFill block={block} value={value} onChange={onChange} />;
    case 'gap_fill_bank': return <BlockGapFillBank block={block} value={value} onChange={onChange} />;
    case 'matching': return <BlockMatching block={block} value={value} onChange={onChange} />;
    case 'audio': return <BlockAudio block={block} onEditMedia={onEditMedia} />;
    case 'open_input': return <BlockOpenInput block={block} value={value} onChange={onChange} />;
    case 'grammar_card': return <BlockGrammarCard block={block} />;
    case 'flashcards': return <BlockFlashcards block={block} />;
    case 'sentence_reorder': return <BlockReorder block={block} value={value} onChange={onChange} />;
    case 'categorization': return <BlockCategorization block={block} value={value} onChange={onChange} />;
    default: return <div className="p-4 bg-amber-50 text-amber-800 rounded-lg">Тип блока: {block.type}</div>;
  }
};
