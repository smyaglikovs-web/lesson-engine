import React from 'react';
import { Button } from './ui/Button.jsx';
import { Card, CardContent } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';

export const LibraryView = ({ lessons, loading, onOpenLesson, onCreateNew, onDeleteLesson, onViewSubmissions }) => (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Облачная библиотека уроков</h2>
        <p className="text-slate-500 text-sm mt-1">Управление интерактивными уроками и результатами учеников</p>
      </div>
      <Button variant="primary" onClick={onCreateNew}>
        + Создать урок (JSON)
      </Button>
    </div>

    {loading ? (
      <div className="text-center py-16 text-slate-400 font-medium">Загрузка из Cloudflare D1...</div>
    ) : lessons.length === 0 ? (
      <Card className="text-center py-16">
        <CardContent>
          <span className="text-4xl mb-2 block">📚</span>
          <p className="text-slate-500 font-bold">Пока нет уроков в библиотеке.</p>
          <p className="text-slate-400 text-xs mt-1">Нажмите "+ Создать урок", чтобы запустить конструктор!</p>
        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map(l => (
          <Card key={l.id} interactive className="flex flex-col justify-between">
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="brand">{l.level || 'A2-B1'}</Badge>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onViewSubmissions(l)}>
                    📊 Ответы ДЗ
                  </Button>
                  <Button variant="danger" size="sm" onClick={(e) => onDeleteLesson(l.id, e)} title="Удалить урок">
                    🗑️
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-snug">{l.title}</h3>
                <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">{l.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <Button variant="success" onClick={() => onOpenLesson(l.id)}>
                  Провести урок
                </Button>
                <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?homework=${l.id}`); alert('🔗 Ссылка скопирована!'); }}>
                  Ссылка на ДЗ 🏠
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
);
