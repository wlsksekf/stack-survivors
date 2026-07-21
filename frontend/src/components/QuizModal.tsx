import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { useGameStore } from '../store/gameStore';

const VALID_SKILLS = [
  'C',
  'C++',
  'HTML',
  'Java',
  'JavaScript',
  'Python',
  'React'
] as const;

type SkillType = typeof VALID_SKILLS[number];

interface Question {
  id: string;
  skill_type: SkillType;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string | null;
  difficulty?: number;
}

interface QuestionsResponse {
  data?: unknown;
  count?: number;
  invalid_count?: number;
  invalid_question_ids?: string[];
}

const isValidSkill = (
  value: unknown
): value is SkillType => {
  return (
    typeof value === 'string'
    && VALID_SKILLS.includes(value as SkillType)
  );
};

const normalizeOptions = (
  rawOptions: unknown
): string[] => {
  let parsed: unknown = rawOptions;

  /*
   * 백엔드에서 options가 JSON 문자열로 오는 경우:
   * '["A", "B", "C", "D"]'
   */
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  /*
   * Array.isArray 검사 이후 별도 변수로 옮겨
   * TypeScript에 unknown[] 타입임을 명확하게 알려줍니다.
   */
  let optionsArray: unknown[] = parsed;

  /*
   * 잘못 저장된 형태:
   *
   * ['["A", "B", "C", "D"]']
   *
   * 정상 형태:
   *
   * ["A", "B", "C", "D"]
   */
  if (
    optionsArray.length === 1
    && typeof optionsArray[0] === 'string'
  ) {
    const firstValue = optionsArray[0].trim();

    if (
      firstValue.startsWith('[')
      && firstValue.endsWith(']')
    ) {
      try {
        const nestedParsed: unknown =
          JSON.parse(firstValue);

        if (Array.isArray(nestedParsed)) {
          optionsArray = nestedParsed;
        }
      } catch {
        // 일반 문자열 선택지라면 기존 배열을 유지합니다.
      }
    }
  }

  return optionsArray
    .map((option): string => {
      if (typeof option === 'string') {
        return option.trim();
      }

      if (
        option === null
        || option === undefined
      ) {
        return '';
      }

      return String(option).trim();
    })
    .filter((option) => option.length > 0);
};

const normalizeQuestion = (
  rawQuestion: unknown
): Question | null => {
  if (
    typeof rawQuestion !== 'object'
    || rawQuestion === null
  ) {
    return null;
  }

  const row = rawQuestion as Record<string, unknown>;

  const id = String(
    row.id ?? ''
  ).trim();

  const skillValue =
    row.skill_type
    ?? row.language;

  const questionText = String(
    row.question_text
    ?? row.question
    ?? ''
  ).trim();

  const options = normalizeOptions(
    row.options
  );

  const rawAnswerIndex =
    row.correct_answer_index
    ?? row.answer_index;

  const answerIndex = Number(
    rawAnswerIndex
  );

  if (!id) {
    return null;
  }

  if (!isValidSkill(skillValue)) {
    return null;
  }

  if (!questionText) {
    return null;
  }

  if (options.length !== 4) {
    return null;
  }

  if (
    !Number.isInteger(answerIndex)
    || answerIndex < 0
    || answerIndex > 3
  ) {
    return null;
  }

  const rawDifficulty = Number(
    row.difficulty ?? 1
  );

  const difficulty =
    Number.isInteger(rawDifficulty)
    && rawDifficulty >= 1
    && rawDifficulty <= 3
      ? rawDifficulty
      : 1;

  return {
    id,
    skill_type: skillValue,
    question_text: questionText,
    options,
    correct_answer_index: answerIndex,
    explanation:
      typeof row.explanation === 'string'
        ? row.explanation.trim()
        : null,
    difficulty
  };
};

const FALLBACK_QUESTION: Question = {
  id: 'fallback-python-function',
  skill_type: 'Python',
  question_text:
    'Python에서 함수를 정의할 때 사용하는 키워드는 무엇인가요?',
  options: [
    'func',
    'def',
    'function',
    'define'
  ],
  correct_answer_index: 1,
  explanation:
    'Python에서는 def 키워드를 사용해 함수를 정의합니다.',
  difficulty: 1
};

export const QuizModal: React.FC = () => {
  const {
    isQuizModalOpen,
    closeQuiz
  } = useGameStore();

  const [question, setQuestion] =
    useState<Question | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [selectedOption, setSelectedOption] =
    useState<number | null>(null);

  const [feedback, setFeedback] =
    useState<'correct' | 'wrong' | null>(null);

  const closeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const fetchQuestion = useCallback(async () => {
    /*
     * 이전 요청이 아직 진행 중이면 취소합니다.
     */
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setErrorMessage(null);
    setQuestion(null);

    try {
      const response = await fetch(
        '/api/questions?limit=210',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          },
          signal: controller.signal
        }
      );

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;

        try {
          const errorBody: unknown =
            await response.json();

          if (
            typeof errorBody === 'object'
            && errorBody !== null
            && 'detail' in errorBody
          ) {
            const detailValue = (
              errorBody as Record<string, unknown>
            ).detail;

            if (typeof detailValue === 'string') {
              detail = detailValue;
            }
          }
        } catch {
          // JSON 응답이 아니면 기본 오류 메시지를 사용합니다.
        }

        throw new Error(
          `문제 API 요청 실패: ${detail}`
        );
      }

      const responseBody: unknown =
        await response.json();

      if (
        typeof responseBody !== 'object'
        || responseBody === null
      ) {
        throw new Error(
          '문제 API 응답 형식이 올바르지 않습니다.'
        );
      }

      const parsedResponse =
        responseBody as QuestionsResponse;

      if (!Array.isArray(parsedResponse.data)) {
        throw new Error(
          '문제 API의 data가 배열이 아닙니다.'
        );
      }

      const validQuestions: Question[] =
        parsedResponse.data
          .map((item) => normalizeQuestion(item))
          .filter(
            (item): item is Question =>
              item !== null
          );

      if (validQuestions.length === 0) {
        throw new Error(
          '사용 가능한 문제가 없습니다.'
        );
      }

      const randomIndex = Math.floor(
        Math.random() * validQuestions.length
      );

      setQuestion(
        validQuestions[randomIndex]
      );
    } catch (error: unknown) {
      if (
        error instanceof DOMException
        && error.name === 'AbortError'
      ) {
        return;
      }

      console.error(
        'Failed to fetch quiz question:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '문제를 불러오지 못했습니다.'
      );

      setQuestion(FALLBACK_QUESTION);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isQuizModalOpen) {
      abortControllerRef.current?.abort();
      clearCloseTimer();

      setQuestion(null);
      setSelectedOption(null);
      setFeedback(null);
      setErrorMessage(null);

      return;
    }

    setSelectedOption(null);
    setFeedback(null);
    setErrorMessage(null);

    void fetchQuestion();

    return () => {
      abortControllerRef.current?.abort();
      clearCloseTimer();
    };
  }, [
    isQuizModalOpen,
    fetchQuestion,
    clearCloseTimer
  ]);

  const handleSelect = (
    selectedIndex: number
  ) => {
    if (
      feedback !== null
      || question === null
      || loading
    ) {
      return;
    }

    setSelectedOption(selectedIndex);

    const isCorrect =
      selectedIndex
      === question.correct_answer_index;

    setFeedback(
      isCorrect
        ? 'correct'
        : 'wrong'
    );

    clearCloseTimer();

    closeTimerRef.current = setTimeout(() => {
      if (isCorrect) {
        closeQuiz(
          true,
          question.skill_type
        );
      } else {
        closeQuiz(false);
      }

      closeTimerRef.current = null;
    }, 1500);
  };

  if (!isQuizModalOpen) {
    return null;
  }

  const skill =
    question?.skill_type ?? 'STACK';

  const answerIndex =
    question?.correct_answer_index;

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <section className="modal-panel">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">
              Security Quiz
            </p>

            <h2
              id="quiz-modal-title"
              className="title-font modal-title"
            >
              권한 침투 감지
            </h2>
          </div>

          <span className="modal-badge">
            {skill}
          </span>
        </header>

        <div className="modal-body">
          {loading ? (
            <div className="empty-state title-font">
              문제를 복호화하는 중...
            </div>
          ) : question ? (
            <>
              {errorMessage && (
                <div
                  className="quiz-warning"
                  role="status"
                >
                  서버 문제를 불러오지 못해 기본 문제를
                  표시합니다.
                </div>
              )}

              <div className="question-box">
                {question.question_text}
              </div>

              <div className="quiz-grid">
                {question.options.map(
                  (option, index) => {
                    let stateClass = '';

                    if (selectedOption !== null) {
                      if (index === answerIndex) {
                        stateClass = 'correct';
                      } else if (
                        index === selectedOption
                      ) {
                        stateClass = 'wrong';
                      }
                    }

                    return (
                      <button
                        key={`${question.id}-${index}`}
                        type="button"
                        className={
                          `quiz-option ${stateClass}`
                        }
                        onClick={() => {
                          handleSelect(index);
                        }}
                        disabled={
                          feedback !== null
                          || loading
                        }
                        aria-pressed={
                          selectedOption === index
                        }
                      >
                        <span className="option-index">
                          {index + 1}
                        </span>

                        <span className="option-text">
                          {option}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              <div
                className={`feedback ${feedback ?? ''}`}
                role="status"
                aria-live="polite"
              >
                {feedback === 'correct'
                  && `${skill} 권한이 상승했습니다`}

                {feedback === 'wrong'
                  && '접근이 거부되었습니다'}
              </div>

              {feedback !== null
                && question.explanation && (
                  <div className="quiz-explanation">
                    {question.explanation}
                  </div>
                )}
            </>
          ) : (
            <div className="empty-state">
              문제를 불러오지 못했습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};