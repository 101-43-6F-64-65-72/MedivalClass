/**
 * Game Phase Definitions & State Machine
 * Phases: waiting → phase_1 → phase_2 → phase_3 → phase_4 → phase_5 → [phase_6+]
 */

export const GAME_PHASES = {
  WAITING: 'waiting',
  PHASE_1: 'phase_1',        // Story: Departure & Journey
  PHASE_2: 'phase_2',        // Storm Event
  PHASE_3: 'phase_3',        // Aftermath & Roles
  PHASE_4: 'phase_4',        // Master Prompt Brainstorm
  PHASE_5: 'phase_5',        // Tragedy & Farewell
};

export const PHASE_DETAILS = {
  [GAME_PHASES.WAITING]: {
    name: 'Waiting Lobby',
    minPlayers: 1,
    maxPlayers: 4,
    allowMovement: true,
    allowChat: true,
    adminControls: true,
    nextPhase: GAME_PHASES.PHASE_1,
    description: 'Menunggu semua player dan admin siap'
  },
  
  [GAME_PHASES.PHASE_1]: {
    name: 'Story #1: Departure & Journey',
    sceneCount: 4,
    estimatedDuration: 8 * 60 * 1000, // 8 menit
    allowMovement: false,
    allowChat: false,
    adminControls: false,
    nextPhase: GAME_PHASES.PHASE_2,
    description: 'Mereka berlayar, berdialog, badai datang!'
  },
  
  [GAME_PHASES.PHASE_2]: {
    name: 'Story #2: Storm Event',
    sceneCount: 3,
    estimatedDuration: 7 * 60 * 1000, // 7 menit
    allowMovement: false,
    allowChat: false,
    adminControls: true, // Admin trigger "Kami Selamat!"
    nextPhase: GAME_PHASES.PHASE_3,
    description: 'Badai brutal, menunggu admin untuk lanjut'
  },
  
  [GAME_PHASES.PHASE_3]: {
    name: 'Story #3: Aftermath & Role Division',
    sceneCount: 4,
    estimatedDuration: 5 * 60 * 1000, // 5 menit
    allowMovement: false,
    allowChat: false,
    adminControls: false,
    nextPhase: GAME_PHASES.PHASE_4,
    description: 'Aman di pantai, Pleton assign roles'
  },
  
  [GAME_PHASES.PHASE_4]: {
    name: 'Discussion & Master Prompt',
    subPhases: ['discussion', 'form', 'commit'],
    estimatedDuration: 20 * 60 * 1000, // 20 menit
    allowMovement: false,
    allowChat: true,
    adminControls: false,
    nextPhase: GAME_PHASES.PHASE_5,
    description: 'Diskusi peran, isi Master Prompt, commit hasil'
  },
  
  [GAME_PHASES.PHASE_5]: {
    name: 'Tragedy & Farewell',
    sceneCount: 5,
    estimatedDuration: 10 * 60 * 1000, // 10 menit
    allowMovement: false,
    allowChat: false,
    adminControls: false,
    nextPhase: null,
    description: 'Pleton disappears, emotional farewell, game over'
  },
};

export const PLAYER_ROLES = {
  LEADER: 'leader',        // Koordinator
  DESIGNER: 'designer',    // Kreatif/visual
  MECHANIC: 'mechanic',    // Teknis/development
  NARRATIVE: 'narrative',  // Story/world-building
};

export const ROLE_DESCRIPTIONS = {
  [PLAYER_ROLES.LEADER]: {
    name: 'Koordinator/Leader',
    description: 'Memimpin diskusi, memastikan progress, koordinasikan semua'
  },
  [PLAYER_ROLES.DESIGNER]: {
    name: 'Desainer/Creative',
    description: 'Visi artistik, visual direction, estetika game'
  },
  [PLAYER_ROLES.MECHANIC]: {
    name: 'Mekanik/Developer',
    description: 'Sistem game, implementasi teknis, gameplay loop'
  },
  [PLAYER_ROLES.NARRATIVE]: {
    name: 'Naratif/Storyteller',
    description: 'Cerita, world-building, character development'
  },
};

/**
 * Helper to generate structured Master Prompt document
 */
export function generateMasterPrompt(data = {}) {
  return `### MASTER GAME DESIGN PROMPT
**Nama Game:** ${data.gameName || 'Untitled Project'}
**Genre:** ${data.genre || 'Adventure RPG'}
**Target User:** ${data.targetUser || 'General Players'}
**Tujuan Game:** ${data.gameGoal || 'Selesaikan misi utama'}
**Core Gameplay Loop:** ${data.coreGameplay || 'Eksplorasi, dialog, puzzle'}
**Tingkat Kesulitan Dev:** ${data.devLevel || 'Beginner/Intermediate'}
**Kondisi Target Device:** ${data.deviceCondition || 'Web Browser Desktop / Mobile'}
`;
}
