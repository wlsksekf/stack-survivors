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
('Python', 'What keyword is used to define a function in Python?', '["func", "def", "function", "define"]', 1),
('Python', 'Which data structure is immutable in Python?', '["List", "Dictionary", "Set", "Tuple"]', 3),
('JavaScript', 'What does `typeof null` return?', '["null", "undefined", "object", "string"]', 2),
('JavaScript', 'Which method adds an element to the end of an array?', '["push()", "pop()", "shift()", "unshift()"]', 0),
('React', 'What hook is used to manage side effects in React?', '["useState", "useEffect", "useMemo", "useRef"]', 1),
('React', 'What is the virtual DOM?', '["A direct copy of the real DOM", "A lightweight JavaScript representation of the DOM", "A plugin for browsers", "A physical server"]', 1),
('Java', 'Which keyword is used to inherit a class in Java?', '["implements", "inherits", "extends", "super"]', 2),
('Java', 'What is the size of an int in Java?', '["8 bits", "16 bits", "32 bits", "64 bits"]', 2),
('C', 'Which function is used to allocate memory dynamically in C?', '["malloc()", "alloc()", "new", "create()"]', 0),
('C++', 'Which operator is used for dynamic memory allocation in C++?', '["malloc()", "allocate", "new", "ptr"]', 2);
