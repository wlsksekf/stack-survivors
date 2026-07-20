import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface Question {
  id: string;
  language: string;
  question: string;
  options: string[];
  answer_index: number;
}

export const QuizModal: React.FC = () => {
  const { isQuizModalOpen, closeQuiz } = useGameStore();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        question: 'What keyword is used to define a function in Python?',
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
    
    if (idx === question.answer_index) {
      setFeedback('correct');
      setTimeout(() => closeQuiz(true, question.language), 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => closeQuiz(false), 1500);
    }
  };

  if (!isQuizModalOpen) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: '#1e293b', padding: '40px', borderRadius: '16px',
        border: '2px solid #3b82f6', color: 'white', maxWidth: '600px', width: '90%',
        textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ color: '#fcd34d', marginBottom: '10px', fontSize: '28px' }}>
          🧠 Tech Quiz Time!
        </h2>
        <p style={{ color: '#cbd5e1', marginBottom: '30px' }}>
          Answer correctly to significantly upgrade your {question?.language} skill!
        </p>

        {loading ? (
          <div style={{ padding: '40px' }}>Loading question...</div>
        ) : question ? (
          <>
            <div style={{ 
              backgroundColor: '#334155', padding: '20px', borderRadius: '8px',
              fontSize: '20px', marginBottom: '30px'
            }}>
              {question.question}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {question.options.map((opt, idx) => {
                let bgColor = '#475569';
                let borderColor = 'transparent';
                
                if (selectedOption !== null) {
                  if (idx === question.answer_index) {
                    bgColor = '#059669'; // Green if correct answer
                  } else if (idx === selectedOption) {
                    bgColor = '#e11d48'; // Red if wrong selection
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={{
                      padding: '15px', fontSize: '18px', borderRadius: '8px',
                      backgroundColor: bgColor, color: 'white', border: `2px solid ${borderColor}`,
                      cursor: feedback === null ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            
            {feedback === 'correct' && (
              <div style={{ marginTop: '20px', color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
                🎉 Correct! {question.language} Skill +3!
              </div>
            )}
            {feedback === 'wrong' && (
              <div style={{ marginTop: '20px', color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
                ❌ Wrong! Try again later.
              </div>
            )}
          </>
        ) : (
          <div>Failed to load question</div>
        )}
      </div>
    </div>
  );
};
