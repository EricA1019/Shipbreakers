import { useGameStore } from '../../stores/gameStore';

export default function CrewScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { crewRoster, selectedCrewId, selectCrew, day } = useGameStore((s) => ({
    crewRoster: s.crewRoster,
    selectedCrewId: s.selectedCrewId,
    selectCrew: s.selectCrew,
    day: s.day,
  }));

  const getSkillColor = (level: number) => {
    if (level >= 4) return 'text-green-400';
    if (level >= 3) return 'text-amber-400';
    if (level >= 2) return 'text-orange-400';
    return 'text-zinc-400';
  };

  const getHealthColor = (hp: number, maxHp: number) => {
    const percent = (hp / maxHp) * 100;
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSkillBarColor = (level: number) => {
    if (level >= 4) return 'bg-green-500';
    if (level >= 3) return 'bg-amber-500';
    if (level >= 2) return 'bg-orange-500';
    return 'bg-zinc-500';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">CREW MANIFEST</div>
        <button
          className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30"
          onClick={() => onNavigate('hub')}
        >
          ← Back to Hub
        </button>
      </div>

      {/* Crew roster info */}
      <div className="bg-zinc-800 border border-amber-600/20 p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-400 text-xs font-mono">ROSTER STATUS</div>
            <div className="text-amber-100 font-bold text-lg">
              {crewRoster.length} / 5 Crew Members
            </div>
          </div>
          <div className="text-right">
            <div className="text-zinc-400 text-xs">Day {day}</div>
            <div className="text-amber-400 text-xs">
              {crewRoster.length < 5 ? `${5 - crewRoster.length} slots available` : 'Roster full'}
            </div>
          </div>
        </div>
      </div>

      {/* Crew member cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crewRoster.map((crew) => {
          const isSelected = crew.id === selectedCrewId;
          const healthPercent = (crew.hp / crew.maxHp) * 100;
          const daysEmployed = crew.hiredDay ? day - crew.hiredDay : day;

          return (
            <div
              key={crew.id}
              onClick={() => selectCrew(crew.id)}
              className={`bg-zinc-800 border-2 p-4 rounded cursor-pointer transition-all ${
                isSelected
                  ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'border-amber-600/20 hover:border-amber-500/50'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-amber-100 font-bold text-lg">{crew.name}</div>
                    {crew.isPlayer && (
                      <span className="bg-amber-600 text-zinc-900 px-2 py-0.5 text-xs font-bold rounded">
                        CAPTAIN
                      </span>
                    )}
                    {isSelected && !crew.isPlayer && (
                      <span className="bg-green-600 text-zinc-900 px-2 py-0.5 text-xs font-bold rounded">
                        ASSIGNED
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-400 text-xs mt-1">
                    {crew.isPlayer ? 'Original crew member' : `Hired Day ${crew.hiredDay} • ${daysEmployed} days employed`}
                  </div>
                </div>
                <div className="text-right">
                  {crew.hireCost && (
                    <div className="text-amber-400 text-xs">Cost: {crew.hireCost} CR</div>
                  )}
                </div>
              </div>

              {/* Health bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-zinc-400 text-xs font-mono">HEALTH</div>
                  <div className={`text-xs font-bold ${healthPercent < 40 ? 'text-red-400' : 'text-green-400'}`}>
                    {crew.hp} / {crew.maxHp} HP
                  </div>
                </div>
                <div className="w-full bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getHealthColor(crew.hp, crew.maxHp)} transition-all`}
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
                {crew.hp < crew.maxHp && (
                  <div className="text-orange-400 text-xs mt-1">⚠️ Needs medical attention</div>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <div className="text-zinc-400 text-xs font-mono mb-2">SKILLS</div>
                
                {/* Technical */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-zinc-300 text-xs">🔧 Technical</div>
                    <div className={`text-xs font-bold ${getSkillColor(crew.skills.technical)}`}>
                      Lv.{crew.skills.technical}
                      <span className="text-zinc-500 ml-1">({crew.skillXp.technical} XP)</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getSkillBarColor(crew.skills.technical)} transition-all`}
                      style={{ width: `${(crew.skills.technical / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Combat */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-zinc-300 text-xs">⚔️ Combat</div>
                    <div className={`text-xs font-bold ${getSkillColor(crew.skills.combat)}`}>
                      Lv.{crew.skills.combat}
                      <span className="text-zinc-500 ml-1">({crew.skillXp.combat} XP)</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getSkillBarColor(crew.skills.combat)} transition-all`}
                      style={{ width: `${(crew.skills.combat / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Salvage */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-zinc-300 text-xs">🔨 Salvage</div>
                    <div className={`text-xs font-bold ${getSkillColor(crew.skills.salvage)}`}>
                      Lv.{crew.skills.salvage}
                      <span className="text-zinc-500 ml-1">({crew.skillXp.salvage} XP)</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getSkillBarColor(crew.skills.salvage)} transition-all`}
                      style={{ width: `${(crew.skills.salvage / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Piloting */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-zinc-300 text-xs">🚀 Piloting</div>
                    <div className={`text-xs font-bold ${getSkillColor(crew.skills.piloting)}`}>
                      Lv.{crew.skills.piloting}
                      <span className="text-zinc-500 ml-1">({crew.skillXp.piloting} XP)</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getSkillBarColor(crew.skills.piloting)} transition-all`}
                      style={{ width: `${(crew.skills.piloting / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action button */}
              {!isSelected && !crew.isPlayer && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCrew(crew.id);
                  }}
                  className="mt-4 w-full bg-amber-600 text-zinc-900 py-2 font-bold rounded hover:bg-amber-500 transition"
                >
                  Assign to Next Run
                </button>
              )}

              {isSelected && !crew.isPlayer && (
                <div className="mt-4 w-full bg-green-600/20 border border-green-600/50 text-green-400 py-2 text-center font-bold rounded">
                  ✓ Currently Assigned
                </div>
              )}
            </div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: 5 - crewRoster.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="bg-zinc-800/50 border-2 border-dashed border-zinc-700 p-4 rounded flex items-center justify-center min-h-[300px]"
          >
            <div className="text-center text-zinc-600">
              <div className="text-4xl mb-2">➕</div>
              <div className="text-sm">Empty Slot</div>
              <div className="text-xs mt-1">Hire crew from Hub</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-zinc-800 border border-amber-600/20 p-3 rounded">
        <div className="text-amber-400 text-xs font-mono mb-2">SKILL LEVELS</div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-zinc-500 rounded"></div>
            <span className="text-zinc-400">1 - Novice</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-zinc-400">2 - Apprentice</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-zinc-400">3 - Competent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-zinc-400">4-5 - Expert/Master</span>
          </div>
        </div>
      </div>
    </div>
  );
}
