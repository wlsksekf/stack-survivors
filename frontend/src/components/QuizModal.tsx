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
      const res = await fetch('/api/questions');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        const randomQ = data.data[Math.floor(Math.random() * data.data.length)];
        if (typeof randomQ.options === 'string') {
          randomQ.options = JSON.parse(randomQ.options);
        }
        setQuestion(randomQ);
      } else {
        throw new Error('No questions found');
      }
    } catch (err) {
      console.error(err);
      setQuestion({
        id: 'fallback',
        skill_type: 'Python',
        question_text: 'Python에서 함수를 정의할 때 사용하는 키워드는?',
        options: ['func', 'def', 'function', 'define'],
        correct_answer_index: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (feedback !== null || !question) return;

    setSelectedOption(idx);

    const answerIndex = question.answer_index ?? question.correct_answer_index;
    const skill = question.language || question.skill_type;

    if (idx === answerIndex) {
      setFeedback('correct');
      setTimeout(() => closeQuiz(true, skill), 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => closeQuiz(false), 1500);
    }
  };

  if (!isQuizModalOpen) return null;

  const skill = question?.language || question?.skill_type || 'STACK';
  const answerIndex = question?.answer_index ?? question?.correct_answer_index;

  return (
    <div className="overlay">
      <section className="modal-panel">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">Security Quiz</p>
            <h2 className="title-font modal-title">권한 침투 감지</h2>
          </div>
          <span className="modal-badge">{skill}</span>
        </header>

        <div className="modal-body">
          {loading ? (
            <div className="empty-state title-font">문제를 복호화하는 중...</div>
          ) : question ? (
            <>
              <div className="question-box">{question.question || question.question_text}</div>
              <div className="quiz-grid">
                {question.options.map((option, idx) => {
                  const stateClass = selectedOption === null
                    ? ''
                    : idx === answerIndex
                      ? 'correct'
                      : idx === selectedOption
                        ? 'wrong'
                        : '';

                  return (
                    <button
                      key={option}
                      className={`quiz-option ${stateClass}`}
                      onClick={() => handleSelect(idx)}
                    >
                      <span className="option-index">{idx + 1}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              <div className={`feedback ${feedback || ''}`}>
                {feedback === 'correct' && `${skill} 권한이 상승했습니다`}
                {feedback === 'wrong' && '접근이 거부되었습니다'}
              </div>
            </>
          ) : (
            <div className="empty-state">문제를 불러오지 못했습니다.</div>
          )}
        </div>
      </section>
    </div>
  );
};
