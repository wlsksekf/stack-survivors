import React from 'react';
import { useGameStore } from '../store/gameStore';

const allSkills = [
  { name: 'C', desc: '빠른 속도로 날아가는 단일 타겟 총알.' },
  { name: 'C++', desc: '적을 관통하는 즉발성 레이저 빔.' },
  { name: 'Java', desc: '거대한 폭발 범위(AoE)를 가진 느린 파이어볼.' },
  { name: 'React', desc: '적을 관통하고 되돌아오는 부메랑.' },
  { name: 'HTML', desc: '적을 밀쳐내는 궤도 방어막.' },
  { name: 'JavaScript', desc: '주변 적들에게 지속 피해(DoT)를 입히는 문자열 오라.' },
  { name: 'Python', desc: '적을 관통하며 일직선으로 뻗어나가는 뱀(Snake) 공격.' }
];

export const SkillSelectionModal: React.FC = () => {
  const { isLevelUpModalOpen, levelUp, selectSkill } = useGameStore();

  if (!isLevelUpModalOpen) return null;

  const handleSelect = (skill: string) => {
    selectSkill(skill);
    levelUp();
  };

  // Pick 3 random skills
  const shuffled = [...allSkills].sort(() => 0.5 - Math.random());
  const options = shuffled.slice(0, 3);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 100, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', maxWidth: '900px'
      }}>
        <h2 className="title-font" style={{ 
          marginBottom: '10px', color: '#fcd34d', fontSize: '50px',
          textShadow: '0 0 20px #fbbf24', letterSpacing: '5px'
        }}>
          LEVEL UP!
        </h2>
        <p style={{ marginBottom: '40px', color: '#cbd5e1', fontSize: '20px' }}>새로운 기술 스택을 선택하세요:</p>
        
        <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center' }}>
          {options.map((skill) => (
            <button
              key={skill.name}
              onClick={() => handleSelect(skill.name)}
              style={{
                flex: 1, minHeight: '250px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '2px solid #334155',
                color: 'white', padding: '25px', borderRadius: '12px',
                cursor: 'pointer', textAlign: 'center',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 1)';
                e.currentTarget.style.border = '2px solid #fbbf24';
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(251, 191, 36, 0.3), 0 0 15px rgba(251, 191, 36, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
                e.currentTarget.style.border = '2px solid #334155';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.5)';
              }}
            >
              <strong className="title-font" style={{ display: 'block', fontSize: '28px', marginBottom: '15px', color: '#60a5fa', textShadow: '0 0 10px rgba(96, 165, 250, 0.5)' }}>
                {skill.name}
              </strong>
              <span style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.5', wordBreak: 'keep-all' }}>{skill.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
