-- Create the leaderboard table
CREATE TABLE leaderboard (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  survival_time float NOT NULL,
  level integer NOT NULL,
  correct_answers integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the questions table
CREATE TABLE questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  language text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL, -- Array of strings
  answer_index integer NOT NULL
);

-- Insert some sample questions
INSERT INTO questions (language, question, options, answer_index) VALUES
('Python', '파이썬에서 함수를 정의할 때 사용하는 키워드는 무엇인가요?', '["func", "def", "function", "define"]', 1),
('Python', '파이썬에서 변경할 수 없는(immutable) 자료구조는 무엇인가요?', '["List", "Dictionary", "Set", "Tuple"]', 3),
('JavaScript', '`typeof null`의 결과값은 무엇인가요?', '["null", "undefined", "object", "string"]', 2),
('JavaScript', '배열의 맨 끝에 요소를 추가하는 메서드는 무엇인가요?', '["push()", "pop()", "shift()", "unshift()"]', 0),
('React', 'React에서 사이드 이펙트를 처리하기 위해 사용하는 훅은 무엇인가요?', '["useState", "useEffect", "useMemo", "useRef"]', 1),
('React', '가상 DOM(Virtual DOM)이란 무엇인가요?', '["실제 DOM의 직접적인 복사본", "DOM의 가벼운 자바스크립트 표현", "브라우저용 플러그인", "물리적 서버"]', 1),
('Java', 'Java에서 클래스를 상속받을 때 사용하는 키워드는 무엇인가요?', '["implements", "inherits", "extends", "super"]', 2),
('Java', 'Java에서 int 자료형의 크기는 얼마인가요?', '["8 bits", "16 bits", "32 bits", "64 bits"]', 2),
('C', 'C 언어에서 동적으로 메모리를 할당할 때 사용하는 함수는 무엇인가요?', '["malloc()", "alloc()", "new", "create()"]', 0),
('C++', 'C++에서 동적 메모리 할당에 사용하는 연산자는 무엇인가요?', '["malloc()", "allocate", "new", "ptr"]', 2);
