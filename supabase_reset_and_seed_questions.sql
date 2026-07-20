-- Stack Survivors Supabase reset + seed
-- Destructive only for public.questions: existing questions and answers are replaced.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nickname text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(public.profiles.nickname, EXCLUDED.nickname),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, nickname, avatar_url)
SELECT
  users.id,
  users.email,
  COALESCE(users.raw_user_meta_data->>'nickname', users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', split_part(users.email, '@', 1)),
  users.raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nickname = COALESCE(public.profiles.nickname, EXCLUDED.nickname),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
  updated_at = timezone('utc'::text, now());

UPDATE public.game_records
SET username = COALESCE(public.profiles.nickname, public.profiles.email, public.game_records.username)
FROM public.profiles
WHERE public.game_records.user_id = public.profiles.id;

CREATE TABLE IF NOT EXISTS public.game_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  username text,
  score integer NOT NULL DEFAULT 0,
  survived_time integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  max_level integer NOT NULL DEFAULT 1,
  correct_answers integer NOT NULL DEFAULT 0,
  played_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.game_records
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS survived_time integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS correct_answers integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS played_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'game_records_user_id_fkey'
      AND conrelid = 'public.game_records'::regclass
  ) THEN
    ALTER TABLE public.game_records
      ADD CONSTRAINT game_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DROP TABLE IF EXISTS public.questions;

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_type text NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer_index integer NOT NULL,
  explanation text,
  difficulty integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT questions_skill_type_check CHECK (
    skill_type IN ('C', 'C++', 'HTML', 'Java', 'JavaScript', 'Python', 'React')
  ),
  CONSTRAINT questions_options_array_check CHECK (
    jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4
  ),
  CONSTRAINT questions_correct_answer_index_check CHECK (correct_answer_index BETWEEN 0 AND 3),
  CONSTRAINT questions_difficulty_check CHECK (difficulty BETWEEN 1 AND 3),
  CONSTRAINT questions_unique_text_per_skill UNIQUE (skill_type, question_text)
);

CREATE INDEX questions_skill_type_idx ON public.questions (skill_type);
CREATE INDEX questions_difficulty_idx ON public.questions (difficulty);

WITH raw(skill_type, topic, correct_text, difficulty) AS (
  VALUES
  ('C', 'main 함수', 'main 함수는 C 프로그램의 일반적인 시작점이며 int 값을 반환하도록 작성하는 것이 표준이다.', 1),
  ('C', 'printf 함수', 'printf는 형식 문자열을 기준으로 값을 표준 출력에 출력하는 표준 라이브러리 함수다.', 1),
  ('C', 'scanf 함수', 'scanf는 입력받을 변수의 주소를 전달받아 형식에 맞게 값을 저장한다.', 1),
  ('C', '포인터', '포인터는 메모리 주소를 저장하는 변수이며 역참조로 대상 값에 접근한다.', 1),
  ('C', '배열', '배열 이름은 많은 표현식에서 첫 번째 원소를 가리키는 포인터처럼 변환된다.', 1),
  ('C', '문자열', 'C 문자열은 null 문자로 끝나는 char 배열로 표현된다.', 1),
  ('C', '구조체', 'struct는 서로 다른 타입의 값을 하나의 사용자 정의 타입으로 묶는다.', 1),
  ('C', 'malloc', 'malloc은 동적 메모리를 할당하고 실패하면 NULL을 반환할 수 있다.', 1),
  ('C', 'free', 'free는 동적으로 할당한 메모리를 해제할 때 사용하며 같은 포인터를 두 번 해제하면 위험하다.', 1),
  ('C', 'const', 'const로 선언한 객체는 해당 식별자를 통해 값을 변경할 수 없게 한다.', 1),
  ('C', '헤더 파일', '헤더 파일은 함수 원형, 매크로, 타입 선언 등을 여러 소스 파일에서 공유하게 한다.', 2),
  ('C', '전처리기', '전처리기는 컴파일 전에 include와 define 같은 지시문을 처리한다.', 2),
  ('C', '매크로', '매크로는 단순 텍스트 치환 기반이라 인자 평가 부작용에 주의해야 한다.', 2),
  ('C', 'static 지역 변수', 'static 지역 변수는 함수 호출이 끝나도 값이 유지된다.', 2),
  ('C', 'static 전역 심볼', '파일 범위 static은 해당 심볼의 연결 범위를 현재 번역 단위로 제한한다.', 2),
  ('C', 'enum', 'enum은 이름 있는 정수 상수 집합을 정의할 때 사용한다.', 2),
  ('C', 'typedef', 'typedef는 기존 타입에 새 별칭을 붙여 선언을 더 읽기 쉽게 만든다.', 2),
  ('C', '함수 포인터', '함수 포인터는 함수의 주소를 저장해 콜백 같은 패턴에 사용할 수 있다.', 2),
  ('C', '스택 메모리', '자동 지역 변수는 보통 블록을 벗어나면 수명이 끝난다.', 2),
  ('C', '힙 메모리', '힙에 할당한 메모리는 명시적으로 해제하기 전까지 남을 수 있다.', 2),
  ('C', '포인터 산술', '포인터 산술은 가리키는 타입의 크기 단위로 이동한다.', 3),
  ('C', '배열 경계', 'C는 기본적으로 배열 경계 검사를 하지 않아 범위 밖 접근이 정의되지 않은 동작이 될 수 있다.', 3),
  ('C', 'undefined behavior', '정의되지 않은 동작은 컴파일러가 어떤 결과도 보장하지 않는 상태를 뜻한다.', 3),
  ('C', 'volatile', 'volatile은 외부 요인으로 값이 바뀔 수 있음을 컴파일러에 알려 최적화를 제한한다.', 3),
  ('C', 'restrict', 'restrict 포인터는 같은 객체를 다른 포인터가 별칭으로 가리키지 않는다는 최적화 힌트다.', 3),
  ('C', '비트 연산', '비트 연산자는 정수의 개별 비트를 조작할 때 사용한다.', 3),
  ('C', '파일 입출력', 'fopen은 파일 스트림을 열고 실패하면 NULL을 반환할 수 있다.', 3),
  ('C', 'strncpy 주의점', 'strncpy는 항상 null 종료를 보장하지 않을 수 있어 버퍼 끝 처리가 필요하다.', 3),
  ('C', 'sizeof', 'sizeof는 타입이나 객체의 크기를 바이트 단위로 구한다.', 3),
  ('C', '선언과 정의', '선언은 이름과 타입을 알리고 정의는 실제 저장 공간이나 함수 본문을 제공한다.', 3),

  ('C++', '클래스', 'class는 데이터와 함수를 묶고 기본 접근 지정자가 private인 사용자 정의 타입이다.', 1),
  ('C++', '객체', '객체는 클래스나 타입의 실제 인스턴스로 상태와 동작을 가진다.', 1),
  ('C++', '생성자', '생성자는 객체가 만들어질 때 초기화를 담당하는 특수 멤버 함수다.', 1),
  ('C++', '소멸자', '소멸자는 객체 수명이 끝날 때 자원 정리를 수행하는 특수 멤버 함수다.', 1),
  ('C++', 'public', 'public 멤버는 클래스 외부 코드에서도 접근할 수 있다.', 1),
  ('C++', 'private', 'private 멤버는 기본적으로 해당 클래스 내부에서만 접근할 수 있다.', 1),
  ('C++', '상속', '상속은 기존 클래스의 특성을 바탕으로 새 클래스를 정의하는 기능이다.', 1),
  ('C++', '가상 함수', 'virtual 함수는 기반 클래스 포인터로도 파생 클래스 구현이 호출되게 한다.', 1),
  ('C++', 'std::vector', 'std::vector는 크기가 동적으로 변하는 연속 메모리 기반 컨테이너다.', 1),
  ('C++', 'std::string', 'std::string은 문자열 관리와 메모리 처리를 표준 라이브러리가 맡아주는 타입이다.', 1),
  ('C++', 'RAII', 'RAII는 객체 수명에 자원 획득과 해제를 연결하는 C++ 자원 관리 방식이다.', 2),
  ('C++', '스마트 포인터', 'std::unique_ptr와 std::shared_ptr는 동적 객체 수명 관리를 돕는다.', 2),
  ('C++', 'unique_ptr', 'std::unique_ptr는 하나의 소유자만 허용하는 스마트 포인터다.', 2),
  ('C++', 'shared_ptr', 'std::shared_ptr는 참조 카운트 기반으로 여러 소유자를 허용한다.', 2),
  ('C++', '참조자', '참조자는 이미 존재하는 객체의 별칭이며 null 상태를 표현하지 않는다.', 2),
  ('C++', 'const 멤버 함수', 'const 멤버 함수는 객체의 관찰 가능한 상태를 바꾸지 않겠다는 약속이다.', 2),
  ('C++', '오버로딩', '함수 오버로딩은 같은 이름에 서로 다른 매개변수 목록을 허용한다.', 2),
  ('C++', '오버라이딩', '오버라이딩은 파생 클래스가 기반 클래스의 가상 함수를 재정의하는 것이다.', 2),
  ('C++', '템플릿', '템플릿은 타입이나 값을 매개변수로 받아 일반화된 코드를 작성하게 한다.', 2),
  ('C++', '네임스페이스', 'namespace는 이름 충돌을 줄이기 위해 식별자를 논리적으로 묶는다.', 2),
  ('C++', '이동 생성자', '이동 생성자는 임시 객체의 자원을 복사 대신 이전할 수 있게 한다.', 3),
  ('C++', 'std::move', 'std::move는 객체를 오른값 참조로 캐스팅해 이동 가능 상태로 전달한다.', 3),
  ('C++', '예외 처리', 'try와 catch는 예외를 던지고 처리하는 흐름을 구성한다.', 3),
  ('C++', 'STL 알고리즘', 'STL 알고리즘은 반복자 범위를 받아 컨테이너와 분리된 처리를 제공한다.', 3),
  ('C++', '반복자', '반복자는 컨테이너 원소를 순회하기 위한 일반화된 포인터 같은 객체다.', 3),
  ('C++', '람다', '람다는 익명 함수 객체를 간결하게 만드는 문법이다.', 3),
  ('C++', 'constexpr', 'constexpr은 가능한 경우 컴파일 시간 계산을 허용하거나 요구한다.', 3),
  ('C++', '가상 소멸자', '기반 클래스 포인터로 파생 객체를 삭제할 수 있으면 소멸자를 virtual로 두는 것이 안전하다.', 3),
  ('C++', '복사와 이동', '복사는 자원을 새로 복제하고 이동은 소유권을 이전하는 의미에 가깝다.', 3),
  ('C++', 'nullptr', 'nullptr은 포인터 null 값을 표현하는 타입 안전한 키워드다.', 3),

  ('HTML', '문서 구조', 'HTML 문서는 보통 doctype, html, head, body 구조로 작성한다.', 1),
  ('HTML', 'doctype', 'doctype 선언은 브라우저가 표준 모드로 문서를 해석하도록 돕는다.', 1),
  ('HTML', 'head 요소', 'head에는 제목, 메타데이터, 스타일 연결처럼 화면 본문이 아닌 정보가 들어간다.', 1),
  ('HTML', 'body 요소', 'body에는 사용자가 실제로 보는 문서 콘텐츠가 들어간다.', 1),
  ('HTML', 'h1 요소', 'h1은 문서나 섹션의 가장 높은 수준 제목을 나타낸다.', 1),
  ('HTML', 'p 요소', 'p는 문단을 나타내는 의미론적 요소다.', 1),
  ('HTML', 'a 요소', 'a 요소는 href 속성과 함께 하이퍼링크를 만든다.', 1),
  ('HTML', 'img 요소', 'img는 src로 이미지 위치를 지정하고 alt로 대체 텍스트를 제공한다.', 1),
  ('HTML', 'ul과 ol', 'ul은 순서 없는 목록, ol은 순서 있는 목록을 나타낸다.', 1),
  ('HTML', 'button 요소', 'button은 클릭 가능한 명령 버튼을 나타내며 폼 안에서는 기본 타입에 주의해야 한다.', 1),
  ('HTML', '시맨틱 태그', 'header, nav, main, article 같은 요소는 콘텐츠의 의미 구조를 표현한다.', 2),
  ('HTML', 'label 요소', 'label은 폼 컨트롤과 설명 텍스트를 연결해 접근성을 높인다.', 2),
  ('HTML', 'input type', 'input의 type 속성은 입력 방식과 기본 검증 동작에 영향을 준다.', 2),
  ('HTML', 'form 요소', 'form은 사용자 입력을 하나의 제출 단위로 묶는다.', 2),
  ('HTML', 'meta charset', 'meta charset은 문서의 문자 인코딩을 지정한다.', 2),
  ('HTML', 'viewport meta', 'viewport 메타 태그는 모바일 화면의 레이아웃 폭과 확대 동작에 영향을 준다.', 2),
  ('HTML', 'table 구조', 'table은 tr, th, td 같은 요소로 표 형식 데이터를 표현한다.', 2),
  ('HTML', 'alt 속성', 'alt는 이미지를 볼 수 없는 상황에서도 의미를 전달하기 위한 대체 텍스트다.', 2),
  ('HTML', 'id 속성', 'id는 문서 안에서 고유해야 하며 앵커나 스크립트 선택에 쓰일 수 있다.', 2),
  ('HTML', 'class 속성', 'class는 여러 요소에 공통 스타일이나 동작을 적용하기 위한 분류 이름이다.', 2),
  ('HTML', 'aria-label', 'aria-label은 보이는 텍스트가 부족한 컨트롤에 접근 가능한 이름을 제공한다.', 3),
  ('HTML', 'data 속성', 'data-* 속성은 사용자 정의 데이터를 HTML 요소에 저장할 때 사용한다.', 3),
  ('HTML', 'script defer', 'defer가 붙은 스크립트는 HTML 파싱 후 실행되어 초기 렌더 차단을 줄인다.', 3),
  ('HTML', 'link rel stylesheet', 'link rel="stylesheet"는 외부 CSS 파일을 문서에 연결한다.', 3),
  ('HTML', 'required 속성', 'required는 폼 제출 전에 값 입력을 요구하는 기본 검증을 활성화한다.', 3),
  ('HTML', 'disabled 속성', 'disabled 컨트롤은 사용자 입력과 폼 제출 대상에서 제외된다.', 3),
  ('HTML', 'section 요소', 'section은 주제별 콘텐츠 영역을 나타내며 보통 제목과 함께 사용한다.', 3),
  ('HTML', 'article 요소', 'article은 독립적으로 배포하거나 재사용할 수 있는 콘텐츠를 나타낸다.', 3),
  ('HTML', 'canvas 요소', 'canvas는 스크립트로 픽셀 기반 그래픽을 그릴 수 있는 영역이다.', 3),
  ('HTML', 'HTML 엔티티', 'HTML 엔티티는 예약 문자나 특수 문자를 문서 안에 안전하게 표현한다.', 3),

  ('Java', '클래스', 'Java 클래스는 객체의 필드와 메서드를 정의하는 기본 단위다.', 1),
  ('Java', 'main 메서드', 'public static void main(String[] args)는 일반적인 Java 애플리케이션 시작점이다.', 1),
  ('Java', '객체 생성', 'new 키워드는 클래스의 새 객체를 생성할 때 사용한다.', 1),
  ('Java', '패키지', 'package 선언은 클래스를 논리적 네임스페이스로 묶는다.', 1),
  ('Java', '접근 제어자', 'public, protected, private은 멤버 접근 범위를 제어한다.', 1),
  ('Java', '상속', 'extends는 한 클래스가 다른 클래스를 상속할 때 사용한다.', 1),
  ('Java', '인터페이스', 'interface는 구현해야 할 메서드 계약을 정의한다.', 1),
  ('Java', 'implements', 'implements는 클래스가 인터페이스 계약을 구현함을 나타낸다.', 1),
  ('Java', 'String', 'String은 불변 문자열 객체이며 변경 연산은 새 객체를 만들 수 있다.', 1),
  ('Java', '배열', 'Java 배열은 고정 길이이며 length 필드로 길이를 확인한다.', 1),
  ('Java', 'ArrayList', 'ArrayList는 크기가 동적으로 변하는 List 구현체다.', 2),
  ('Java', 'HashMap', 'HashMap은 키와 값 쌍을 해시 기반으로 저장한다.', 2),
  ('Java', '제네릭', '제네릭은 컬렉션이나 클래스에서 타입 안정성을 높인다.', 2),
  ('Java', '예외 처리', 'try, catch, finally는 예외 발생 시 제어 흐름을 다룬다.', 2),
  ('Java', 'checked exception', 'checked exception은 컴파일 시점에 처리나 선언을 요구받는다.', 2),
  ('Java', 'finally', 'finally 블록은 예외 여부와 관계없이 정리 코드를 실행하는 데 쓰인다.', 2),
  ('Java', 'static', 'static 멤버는 객체 인스턴스가 아니라 클래스에 속한다.', 2),
  ('Java', 'final 변수', 'final 변수는 한 번 초기화한 뒤 다시 대입할 수 없다.', 2),
  ('Java', '오버로딩', '오버로딩은 같은 이름의 메서드를 매개변수 목록으로 구분한다.', 2),
  ('Java', '오버라이딩', '오버라이딩은 상위 타입의 메서드를 하위 클래스에서 재정의하는 것이다.', 2),
  ('Java', 'JVM', 'JVM은 바이트코드를 실행하는 Java 가상 머신이다.', 3),
  ('Java', '가비지 컬렉션', '가비지 컬렉션은 더 이상 도달할 수 없는 객체 메모리를 회수한다.', 3),
  ('Java', 'Stream API', 'Stream API는 컬렉션 데이터를 선언적으로 변환, 필터링, 집계하게 한다.', 3),
  ('Java', '람다식', '람다식은 함수형 인터페이스 구현을 간결하게 표현한다.', 3),
  ('Java', 'record', 'record는 불변 데이터 전달 객체를 간결하게 선언하는 문법이다.', 3),
  ('Java', 'equals와 hashCode', 'HashMap 키로 쓸 객체는 equals와 hashCode 계약을 지켜야 한다.', 3),
  ('Java', '동기화', 'synchronized는 여러 스레드가 공유 자원에 접근할 때 임계 구역을 만든다.', 3),
  ('Java', '스레드', 'Thread나 ExecutorService를 통해 병렬 작업을 실행할 수 있다.', 3),
  ('Java', 'try-with-resources', 'try-with-resources는 AutoCloseable 자원을 자동으로 닫는다.', 3),
  ('Java', 'Optional', 'Optional은 null 가능 결과를 명시적으로 다루기 위한 컨테이너다.', 3),

  ('JavaScript', 'let', 'let은 블록 범위 변수를 선언하며 재할당이 가능하다.', 1),
  ('JavaScript', 'const', 'const는 재할당할 수 없는 블록 범위 바인딩을 만든다.', 1),
  ('JavaScript', 'var', 'var는 함수 범위를 가지며 호이스팅 특성 때문에 주의가 필요하다.', 1),
  ('JavaScript', '배열 push', 'push는 배열 끝에 요소를 추가하고 새 길이를 반환한다.', 1),
  ('JavaScript', '배열 map', 'map은 각 요소를 변환한 새 배열을 반환한다.', 1),
  ('JavaScript', '배열 filter', 'filter는 조건을 만족하는 요소만 모아 새 배열을 반환한다.', 1),
  ('JavaScript', '객체 리터럴', '객체 리터럴은 키와 값 쌍을 중괄호로 표현한다.', 1),
  ('JavaScript', '함수 선언', 'function 키워드로 이름 있는 함수를 선언할 수 있다.', 1),
  ('JavaScript', '화살표 함수', '화살표 함수는 짧은 함수 표현식이며 자체 this 바인딩을 만들지 않는다.', 1),
  ('JavaScript', '템플릿 리터럴', '템플릿 리터럴은 백틱과 보간 표현식으로 문자열을 만든다.', 1),
  ('JavaScript', 'typeof null', 'typeof null의 결과는 역사적 이유로 object다.', 2),
  ('JavaScript', '동등 비교', '===는 타입 변환 없이 엄격하게 값을 비교한다.', 2),
  ('JavaScript', 'Promise', 'Promise는 비동기 작업의 성공 또는 실패 결과를 표현한다.', 2),
  ('JavaScript', 'async 함수', 'async 함수는 항상 Promise를 반환한다.', 2),
  ('JavaScript', 'await', 'await는 Promise가 settle될 때까지 async 함수 실행을 잠시 멈춘다.', 2),
  ('JavaScript', '이벤트 루프', '이벤트 루프는 콜 스택과 태스크 큐를 조율해 비동기 콜백을 실행한다.', 2),
  ('JavaScript', '클로저', '클로저는 함수가 생성될 때의 외부 렉시컬 환경을 기억하는 성질이다.', 2),
  ('JavaScript', '스코프', '스코프는 식별자에 접근할 수 있는 코드 영역을 의미한다.', 2),
  ('JavaScript', '호이스팅', '호이스팅은 선언이 실행 전 처리되어 코드 상단에 있는 것처럼 동작하는 현상이다.', 2),
  ('JavaScript', '구조 분해', '구조 분해 할당은 배열이나 객체의 값을 변수로 쉽게 꺼낸다.', 2),
  ('JavaScript', '스프레드 문법', '스프레드 문법은 배열이나 객체의 요소를 펼쳐 새 값 구성에 활용한다.', 3),
  ('JavaScript', '모듈', 'import와 export는 파일 간 값과 함수를 모듈 단위로 공유하게 한다.', 3),
  ('JavaScript', 'this', 'this 값은 호출 방식에 따라 달라질 수 있다.', 3),
  ('JavaScript', '프로토타입', '프로토타입 체인은 객체가 속성 조회를 위임하는 메커니즘이다.', 3),
  ('JavaScript', 'DOM 선택', 'querySelector는 CSS 선택자로 첫 번째 일치 요소를 찾는다.', 3),
  ('JavaScript', '이벤트 위임', '이벤트 위임은 부모 요소에서 하위 요소 이벤트를 처리하는 패턴이다.', 3),
  ('JavaScript', 'JSON.parse', 'JSON.parse는 JSON 문자열을 JavaScript 값으로 변환한다.', 3),
  ('JavaScript', 'NaN', 'NaN은 자기 자신과도 같지 않으므로 Number.isNaN으로 확인하는 것이 안전하다.', 3),
  ('JavaScript', '옵셔널 체이닝', '옵셔널 체이닝은 중간 값이 null 또는 undefined일 때 안전하게 접근을 멈춘다.', 3),
  ('JavaScript', 'null 병합', '?? 연산자는 왼쪽 값이 null 또는 undefined일 때만 오른쪽 값을 사용한다.', 3),

  ('Python', '들여쓰기', 'Python은 중괄호 대신 들여쓰기로 코드 블록을 구분한다.', 1),
  ('Python', '리스트', 'list는 순서가 있고 변경 가능한 컬렉션이다.', 1),
  ('Python', '튜플', 'tuple은 순서가 있고 변경 불가능한 컬렉션이다.', 1),
  ('Python', '딕셔너리', 'dict는 키와 값 쌍을 저장하는 매핑 타입이다.', 1),
  ('Python', '세트', 'set은 중복 없는 원소 모음을 표현한다.', 1),
  ('Python', '함수 정의', 'def 키워드는 함수를 정의할 때 사용한다.', 1),
  ('Python', '기본 인자', '기본 인자는 함수 호출 시 값을 생략했을 때 사용된다.', 1),
  ('Python', '슬라이싱', '슬라이싱은 시퀀스의 일부 구간을 새 값으로 꺼낼 수 있다.', 1),
  ('Python', '리스트 컴프리헨션', '리스트 컴프리헨션은 반복과 조건을 이용해 리스트를 간결하게 만든다.', 1),
  ('Python', '모듈 import', 'import는 다른 모듈의 이름과 기능을 현재 코드에서 사용할 수 있게 한다.', 1),
  ('Python', '예외 처리', 'try와 except는 예외가 발생했을 때 대체 흐름을 처리한다.', 2),
  ('Python', 'finally', 'finally 블록은 예외 여부와 관계없이 실행된다.', 2),
  ('Python', 'with 문', 'with 문은 컨텍스트 매니저를 사용해 자원 정리를 자동화한다.', 2),
  ('Python', '파일 읽기', 'open으로 파일을 열고 with와 함께 쓰면 파일 닫기를 안전하게 처리할 수 있다.', 2),
  ('Python', 'lambda', 'lambda는 간단한 익명 함수를 만들 때 사용한다.', 2),
  ('Python', '제너레이터', '제너레이터는 yield로 값을 하나씩 생산하며 지연 평가에 유용하다.', 2),
  ('Python', '데코레이터', '데코레이터는 함수를 감싸 기능을 확장하는 문법적 패턴이다.', 2),
  ('Python', '클래스', 'class 키워드는 사용자 정의 객체 타입을 선언한다.', 2),
  ('Python', 'self', 'self는 인스턴스 메서드에서 현재 객체를 가리키는 관례적 첫 매개변수다.', 2),
  ('Python', '패키지', '패키지는 모듈을 디렉터리 단위로 묶어 관리한다.', 2),
  ('Python', '가변 기본값', '리스트 같은 가변 객체를 기본 인자로 두면 호출 간 상태가 공유될 수 있다.', 3),
  ('Python', 'GIL', 'CPython의 GIL은 한 프로세스에서 동시에 실행되는 Python 바이트코드에 제약을 준다.', 3),
  ('Python', 'asyncio', 'asyncio는 이벤트 루프 기반 비동기 I/O를 작성하기 위한 표준 라이브러리다.', 3),
  ('Python', '타입 힌트', '타입 힌트는 정적 분석과 문서화에 도움을 주지만 런타임 강제 검사는 기본적으로 하지 않는다.', 3),
  ('Python', 'dataclass', 'dataclass는 데이터 중심 클래스의 초기화와 표현 메서드를 자동 생성해준다.', 3),
  ('Python', '이터레이터', '이터레이터는 __next__로 다음 값을 제공하는 객체다.', 3),
  ('Python', '언패킹', '언패킹은 시퀀스나 매핑의 값을 여러 변수나 인자로 펼쳐 전달한다.', 3),
  ('Python', 'is와 ==', 'is는 객체 동일성을 비교하고 ==는 값 동등성을 비교한다.', 3),
  ('Python', 'None', 'None은 값이 없음을 나타내는 싱글턴 객체다.', 3),
  ('Python', '가상환경', '가상환경은 프로젝트별 Python 패키지 의존성을 분리한다.', 3),

  ('React', '컴포넌트', '컴포넌트는 UI를 재사용 가능한 단위로 나누는 React의 핵심 개념이다.', 1),
  ('React', 'JSX', 'JSX는 JavaScript 안에서 UI 구조를 태그처럼 작성하게 하는 문법 확장이다.', 1),
  ('React', 'props', 'props는 부모 컴포넌트가 자식 컴포넌트로 전달하는 읽기 전용 입력값이다.', 1),
  ('React', 'state', 'state는 컴포넌트가 렌더링 사이에 보관하는 변경 가능한 데이터다.', 1),
  ('React', 'useState', 'useState는 함수 컴포넌트에서 상태 값을 선언하게 하는 Hook이다.', 1),
  ('React', '이벤트 핸들러', 'React 이벤트 핸들러는 JSX 속성으로 함수를 전달해 등록한다.', 1),
  ('React', '조건부 렌더링', '조건부 렌더링은 상태나 props에 따라 다른 UI를 보여주는 방식이다.', 1),
  ('React', '리스트 렌더링', '배열 map을 사용해 여러 요소를 렌더링할 수 있다.', 1),
  ('React', 'key prop', 'key는 리스트 항목을 안정적으로 식별해 재조정에 도움을 준다.', 1),
  ('React', '제어 컴포넌트', '제어 컴포넌트는 입력 값을 React state로 관리한다.', 1),
  ('React', 'useEffect', 'useEffect는 렌더링 이후 외부 시스템과 동기화할 때 사용한다.', 2),
  ('React', 'effect 의존성 배열', '의존성 배열은 effect가 다시 실행될 조건을 지정한다.', 2),
  ('React', 'cleanup 함수', 'effect cleanup은 구독 해제나 타이머 정리처럼 이전 effect를 정리한다.', 2),
  ('React', 'useRef', 'useRef는 렌더링을 유발하지 않는 변경 가능한 값을 보관할 수 있다.', 2),
  ('React', 'Context', 'Context는 여러 단계의 props 전달 없이 값을 하위 트리에 공유한다.', 2),
  ('React', '커스텀 Hook', '커스텀 Hook은 상태ful 로직을 함수로 추출해 재사용하게 한다.', 2),
  ('React', '불변 업데이트', 'state 배열이나 객체는 기존 값을 직접 바꾸기보다 새 값으로 갱신하는 것이 안전하다.', 2),
  ('React', '컴포넌트 합성', '합성은 컴포넌트를 조합해 복잡한 UI를 만드는 React다운 방식이다.', 2),
  ('React', 'Fragment', 'Fragment는 DOM 노드를 추가하지 않고 여러 요소를 묶는다.', 2),
  ('React', 'Portal', 'Portal은 자식을 현재 DOM 계층 밖의 노드에 렌더링할 수 있게 한다.', 2),
  ('React', '메모이제이션', 'memo, useMemo, useCallback은 불필요한 계산이나 렌더링을 줄이는 데 사용한다.', 3),
  ('React', 'React.memo', 'React.memo는 props가 같을 때 함수 컴포넌트 재렌더링을 건너뛰게 할 수 있다.', 3),
  ('React', 'useMemo', 'useMemo는 비용이 큰 계산 결과를 의존성 기준으로 캐시한다.', 3),
  ('React', 'useCallback', 'useCallback은 함수 참조를 의존성 기준으로 재사용하게 한다.', 3),
  ('React', 'StrictMode', 'StrictMode는 개발 중 잠재적 문제를 찾기 위해 일부 동작을 추가 검사한다.', 3),
  ('React', '에러 바운더리', '에러 바운더리는 하위 렌더링 오류를 잡아 대체 UI를 보여주는 클래스 컴포넌트 패턴이다.', 3),
  ('React', 'Suspense', 'Suspense는 lazy 로딩 같은 비동기 렌더링 대기 상태를 선언적으로 표현한다.', 3),
  ('React', '가상 DOM', 'React는 변경된 UI 설명을 비교해 필요한 DOM 업데이트를 계산한다.', 3),
  ('React', 'hydration', 'hydration은 서버에서 렌더링된 HTML에 클라이언트 React 동작을 연결하는 과정이다.', 3),
  ('React', 'Hook 규칙', 'Hook은 컴포넌트 최상위에서 같은 순서로 호출해야 한다.', 3)
),
numbered AS (
  SELECT
    skill_type,
    topic,
    correct_text,
    difficulty,
    row_number() OVER (PARTITION BY skill_type ORDER BY difficulty, topic) - 1 AS zero_based_number
  FROM raw
),
question_bank AS (
  SELECT
    skill_type,
    skill_type || '에서 ' || topic || '에 대한 설명으로 가장 적절한 것은?' AS question_text,
    correct_text,
    CASE difficulty
      WHEN 1 THEN '해당 개념은 실행 결과와 무관한 주석일 뿐이다.'
      WHEN 2 THEN '해당 개념은 모든 상황에서 자동으로 처리되어 개발자가 고려할 필요가 없다.'
      ELSE '해당 개념은 오래된 기능이라 현재 코드에서는 항상 금지된다.'
    END AS wrong_1,
    '오직 화면 색상이나 글꼴을 바꾸기 위한 기능이다.' AS wrong_2,
    '사용하는 언어나 런타임과 관계없이 완전히 같은 규칙으로 동작한다.' AS wrong_3,
    (zero_based_number % 4)::integer AS correct_answer_index,
    difficulty
  FROM numbered
)
INSERT INTO public.questions (
  skill_type,
  question_text,
  options,
  correct_answer_index,
  difficulty,
  explanation
)
SELECT
  skill_type,
  question_text,
  CASE correct_answer_index
    WHEN 0 THEN jsonb_build_array(correct_text, wrong_1, wrong_2, wrong_3)
    WHEN 1 THEN jsonb_build_array(wrong_1, correct_text, wrong_2, wrong_3)
    WHEN 2 THEN jsonb_build_array(wrong_1, wrong_2, correct_text, wrong_3)
    ELSE jsonb_build_array(wrong_1, wrong_2, wrong_3, correct_text)
  END,
  correct_answer_index,
  difficulty,
  correct_text
FROM question_bank;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are readable by everyone" ON public.questions;
CREATE POLICY "Questions are readable by everyone"
  ON public.questions
  FOR SELECT
  USING (true);

ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaderboard is readable by everyone" ON public.game_records;
CREATE POLICY "Leaderboard is readable by everyone"
  ON public.game_records
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Scores can be inserted by everyone" ON public.game_records;
CREATE POLICY "Scores can be inserted by everyone"
  ON public.game_records
  FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DO $$
BEGIN
  IF (SELECT count(*) FROM public.questions) <> 210 THEN
    RAISE EXCEPTION 'Expected 210 questions, found %', (SELECT count(*) FROM public.questions);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.questions
    GROUP BY skill_type
    HAVING count(*) <> 30
  ) THEN
    RAISE EXCEPTION 'Each skill_type must have exactly 30 questions';
  END IF;
END $$;

SELECT skill_type, count(*) AS question_count
FROM public.questions
GROUP BY skill_type
ORDER BY skill_type;
