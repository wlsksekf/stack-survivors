import json

languages = {
    'C': ['포인터', '메모리 할당', '매크로', '구조체', '배열', '함수', '루프', '변수', '연산자', '파일 입출력'],
    'C++': ['클래스', '객체', '상속', '다형성', '템플릿', 'STL', '예외 처리', '가상 함수', '레퍼런스', '스마트 포인터'],
    'HTML': ['태그', '속성', '폼', '테이블', '시맨틱 마크업', '멀티미디어', '링크', '메타 태그', 'DOM', '접근성'],
    'Java': ['객체지향', '인터페이스', '추상 클래스', '컬렉션 프레임워크', '스레드', '예외 처리', '제네릭', '스트림 API', 'JVM', '가비지 컬렉션'],
    'JavaScript': ['클로저', '프로미스', '이벤트 루프', '호이스팅', '스코프', 'this', 'ES6+', 'DOM 조작', '비동기', '배열 메서드'],
    'Python': ['리스트 컴프리헨션', '데코레이터', '제너레이터', '딕셔너리', '모듈', '패키지', '예외 처리', '람다', '클래스', '파일 입출력'],
    'React': ['컴포넌트', 'JSX', '상태(State)', 'Props', '생명주기', 'Hooks', 'Context API', '라우팅', '성능 최적화', '가상 DOM']
}

import random

distractors = [
    "전혀 무관한 설명입니다.",
    "다른 언어의 특징입니다.",
    "과거 버전에만 존재했던 기능입니다.",
    "문법적 오류를 발생시키는 안티 패턴입니다.",
    "운영체제 레벨에서 지원하는 기능입니다.",
    "네트워크 프로토콜의 일부입니다.",
    "하드웨어 종속적인 특성입니다.",
    "보안 취약점을 유발하는 방식입니다."
]

queries = []

# Generate 30 questions for each language
for lang, topics in languages.items():
    for i in range(30):
        topic = topics[i % len(topics)]
        question_text = f"{lang}의 {topic}에 대한 설명으로 올바른 것은? (기초 문제 {i+1})"
        
        # Options
        wrong_options = random.sample(distractors, 3)
        options = [
            f"{topic}의 올바른 특징입니다.",
            f"{topic}와(과) {wrong_options[0]}",
            f"{topic}와(과) {wrong_options[1]}",
            f"{topic}와(과) {wrong_options[2]}"
        ]
        
        # Randomize correct answer index
        correct_index = random.randint(0, 3)
        
        # Swap correct answer to the designated correct_index
        correct_text = options[0]
        options[0] = options[correct_index]
        options[correct_index] = correct_text
        
        options_json = json.dumps(options, ensure_ascii=False)
        explanation = f"정답은 {correct_index+1}번입니다. {lang}의 {topic}는 이런 특징을 가집니다."
        
        query = f"INSERT INTO public.questions (skill_type, question_text, options, correct_answer_index, difficulty, explanation) VALUES ('{lang}', '{question_text}', '{options_json}', {correct_index}, 1, '{explanation}');"
        queries.append(query)

with open('../seed_questions.sql', 'w', encoding='utf-8') as f:
    f.write("-- Auto-generated 210 questions (30 per skill type)\n")
    f.write("TRUNCATE TABLE public.questions;\n\n")
    for q in queries:
        f.write(q + "\n")

print("Generated 210 questions and saved to seed_questions.sql")
