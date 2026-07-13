import React from 'react';
import { useGameStore } from '../store/gameStore';

const allSkills = [
  { name: 'C', desc: 'Fast single-target bullet.' },
  { name: 'C++', desc: 'Instant piercing laser beam.' },
  { name: 'Java', desc: 'Slow fireball with large AoE blast.' },
  { name: 'React', desc: 'Piercing boomerang that returns.' },
  { name: 'HTML', desc: 'Orbital shield that pushes enemies.' },
  { name: 'JavaScript', desc: 'Large aura of floating text DoT.' },
  { name: 'Python', desc: 'Piercing straight snake attack.' }
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
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px',
        color: 'white', textAlign: 'center', width: '400px',
        border: '2px solid #3b82f6'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#60a5fa' }}>Level Up!</h2>
        <p style={{ marginBottom: '20px' }}>Choose a new tech stack to master:</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {options.map((skill) => (
            <button
              key={skill.name}
              onClick={() => handleSelect(skill.name)}
              style={{
                backgroundColor: '#334155', border: '1px solid #475569',
                color: 'white', padding: '15px', borderRadius: '8px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
            >
              <strong style={{ display: 'block', fontSize: '18px', marginBottom: '5px', color: '#fcd34d' }}>
                {skill.name}
              </strong>
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{skill.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
