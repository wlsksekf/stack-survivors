import React from 'react';
import { useGameStore } from '../store/gameStore';

const allSkills = [
  { name: 'C', desc: '빠른 연사로 가장 가까운 적을 안정적으로 압박합니다.' },
  { name: 'C++', desc: '강력한 범위 타격으로 밀집한 적을 정리합니다.' },
  { name: 'Java', desc: '느리지만 묵직한 투사체가 폭발 피해를 남깁니다.' },
  { name: 'React', desc: '되돌아오는 투사체로 여러 경로를 한 번에 견제합니다.' },
  { name: 'HTML', desc: '회전 방어막으로 가까이 붙은 적을 꾸준히 밀어냅니다.' },
  { name: 'JavaScript', desc: '주변을 도는 코드 조각이 지속 피해를 입힙니다.' },
  { name: 'Python', desc: '관통하는 투사체로 직선상의 적을 빠르게 처리합니다.' }
];

export const SkillSelectionModal: React.FC = () => {
  const { isLevelUpModalOpen, levelUp, selectSkill } = useGameStore();

  if (!isLevelUpModalOpen) return null;

  const handleSelect = (skill: string) => {
    selectSkill(skill);
    levelUp();
  };

  const options = [...allSkills].sort(() => 0.5 - Math.random()).slice(0, 3);

  return (
    <div className="overlay">
      <section className="modal-panel skill-modal">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">Level Up</p>
            <h2 className="title-font modal-title">스택 업그레이드</h2>
          </div>
          <span className="modal-badge">선택 1개</span>
        </header>

        <div className="modal-body">
          <div className="skill-options">
            {options.map((skill) => (
              <button key={skill.name} className="skill-card" onClick={() => handleSelect(skill.name)}>
                <strong className="title-font skill-name">{skill.name}</strong>
                <span className="skill-desc">{skill.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
