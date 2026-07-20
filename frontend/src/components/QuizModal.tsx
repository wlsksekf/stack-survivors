import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface Question {
  id: string;
  language?: string;
  skill_type?: string;
  question?: string;
  question_text?: string;
  options: string[];
  answer_index?: number;
  correct_answer_index?: number;
}

export const QuizModal: React.FC = () => {
  const { isQuizModalOpen, closeQuiz } = useGameStore();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (isQuizModalOpen) {
      fetchQuestion();
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [isQuizModalOpen]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch from your backend URL
      // We will fallback to a default if fetch fails
      const res = await fetch('http://localhost:8000/api/questions');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      if (data.data && data.data.length > 0) {
        const randomQ = data.data[Math.floor(Math.random() * data.data.length)];
        // options might be a JSON string if returned directly from Supabase, or array
        if (typeof randomQ.options === 'string') {
          randomQ.options = JSON.parse(randomQ.options);
        }
        setQuestion(randomQ);
      } else {
        throw new Error('No questions found');
      }
    } catch (err) {
      console.error(err);
      // Fallback question if backend is unreachable
      setQuestion({
        id: 'fallback',
        language: 'Python',
        question: '파이썬에서 함수를 정의할 때 사용하는 키워드는 무엇인가요?',
        options: ['func', 'def', 'function', 'define'],
        answer_index: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (feedback !== null || !question) return;
    
    setSelectedOption(idx);
    
    const aIndex = question.answer_index !== undefined ? question.answer_index : question.correct_answer_index;
    const lang = question.language || question.skill_type;

    if (idx === aIndex) {
      setFeedback('correct');
      setTimeout(() => closeQuiz(true, lang), 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => closeQuiz(false), 1500);
    }
  };

  if (!isQuizModalOpen) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 100, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'rgba(10, 15, 25, 0.95)', padding: '40px', borderRadius: '4px',
        border: '2px solid #0ea5e9', color: 'white', maxWidth: '700px', width: '90%',
        boxShadow: '0 0 20px rgba(14, 165, 233, 0.5), inset 0 0 10px rgba(14, 165, 233, 0.3)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Terminal Header Decor */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '25px',
          backgroundColor: '#0ea5e9', display: 'flex', alignItems: 'center', padding: '0 15px'
        }}>
          <span className="title-font" style={{ color: '#fff', fontSize: '12px', letterSpacing: '2px' }}>SYSTEM OVERRIDE DETECTED // SECURITY BREACH</span>
        </div>

        <h2 className="title-font" style={{ color: '#38bdf8', marginTop: '10px', marginBottom: '15px', fontSize: '32px', textShadow: '0 0 10px #38bdf8', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ animation: 'blink 1s infinite' }}>_</span> TECH QUIZ INTRUSION
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '18px', borderLeft: '3px solid #38bdf8', paddingLeft: '15px' }}>
          정답을 맞히면 <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{question?.language || question?.skill_type}</span> 권한이 대폭 상승합니다.
        </p>

        {loading ? (
          <div className="title-font" style={{ padding: '40px', textAlign: 'center', color: '#0ea5e9', fontSize: '20px' }}>
            DECRYPTING DATA...
          </div>
        ) : question ? (
          <>
            <div style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '25px', borderRadius: '4px',
              fontSize: '22px', marginBottom: '40px', border: '1px solid #334155',
              fontFamily: 'monospace', color: '#e2e8f0'
            }}>
              <span style={{ color: '#f59e0b' }}>&gt;</span> {question.question || question.question_text}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {question.options.map((opt, idx) => {
                let bgColor = 'rgba(15, 23, 42, 0.8)';
                let borderColor = '#475569';
                let textColor = '#cbd5e1';
                
                const aIndex = question.answer_index !== undefined ? question.answer_index : question.correct_answer_index;
                
                if (selectedOption !== null) {
                  if (idx === aIndex) {
                    bgColor = 'rgba(5, 150, 105, 0.2)'; borderColor = '#10b981'; textColor = '#10b981';
                  } else if (idx === selectedOption) {
                    bgColor = 'rgba(225, 29, 72, 0.2)'; borderColor = '#e11d48'; textColor = '#e11d48';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={{
                      padding: '20px', fontSize: '18px', borderRadius: '4px',
                      backgroundColor: bgColor, color: textColor, border: `1px solid ${borderColor}`,
                      cursor: feedback === null ? 'pointer' : 'default',
                      transition: 'all 0.2s', fontFamily: 'monospace', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: '15px'
                    }}
                    onMouseEnter={e => { 
                      if (feedback === null) {
                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.color = '#38bdf8';
                      }
                    }}
                    onMouseLeave={e => { 
                      if (feedback === null) {
                        e.currentTarget.style.backgroundColor = bgColor;
                        e.currentTarget.style.borderColor = borderColor;
                        e.currentTarget.style.color = textColor;
                      }
                    }}
                  >
                    <span style={{ color: '#64748b' }}>[{idx + 1}]</span> {opt}
                  </button>
                );
              })}
            </div>
            
            <div style={{ minHeight: '40px', marginTop: '30px', textAlign: 'center' }}>
              {feedback === 'correct' && (
                <div className="title-font" style={{ color: '#10b981', fontSize: '24px', textShadow: '0 0 10px #10b981' }}>
                  ACCESS GRANTED: {question.language || question.skill_type} +3
                </div>
              )}
              {feedback === 'wrong' && (
                <div className="title-font" style={{ color: '#ef4444', fontSize: '24px', textShadow: '0 0 10px #ef4444' }}>
                  ACCESS DENIED
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="title-font" style={{ color: '#ef4444' }}>ERROR 404: DATA NOT FOUND</div>
        )}
      </div>
    </div>
  );
};
