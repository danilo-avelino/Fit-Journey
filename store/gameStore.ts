
import { create } from 'zustand';
import { UserProfile, Mission, Workout } from '../types';

interface GameState {
  user: UserProfile;
  missions: Mission[];
  workouts: Workout[];
  
  // Actions
  addXp: (amount: number) => void;
  completeMission: (id: string) => void;
  addWorkout: (workout: Workout) => void;
  updateBio: (bio: Partial<UserProfile['bio']>) => void;
  upgradeToPremium: () => void;
}

// Mock Initial Data
const INITIAL_USER: UserProfile = {
  id: '1',
  name: 'Campeã',
  avatarUrl: 'https://picsum.photos/200',
  level: 24,
  rankTitle: 'Deusa da Força',
  xpCurrent: 2400,
  xpTotal: 2450,
  xpNextLevel: 5000,
  gems: 350,
  streak: 12,
  isPremium: false, // Começa como Free
  bio: {
    weight: 82.4,
    muscleMass: 42.1,
    bodyFat: 12.5,
    hydration: 65,
  }
};

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Destruidor de Pernas',
    description: 'Complete 3000kg de volume total em exercícios de perna.',
    progress: 2000,
    total: 3000,
    xpReward: 150,
    gemsReward: 50,
    type: 'weekly',
    isCompleted: false,
    icon: 'dumbbell'
  },
  {
    id: 'm2',
    title: 'Hidratação Divina',
    description: 'Beba 3 litros de água hoje.',
    progress: 2,
    total: 3,
    xpReward: 30,
    gemsReward: 10,
    type: 'daily',
    isCompleted: false,
    icon: 'droplet'
  }
];

export const useGameStore = create<GameState>((set) => ({
  user: INITIAL_USER,
  missions: INITIAL_MISSIONS,
  workouts: [],

  addXp: (amount) => set((state) => {
    // Premium users could verify 2x XP logic here if implemented
    const bonusMultiplier = state.user.isPremium ? 1.5 : 1; 
    const finalAmount = Math.floor(amount * bonusMultiplier);

    const newXp = state.user.xpCurrent + finalAmount;
    const newTotalXp = state.user.xpTotal + finalAmount;
    
    // Simple level up logic
    let newLevel = state.user.level;
    let newNextLevel = state.user.xpNextLevel;
    let currentXpForLevel = newXp;

    if (newXp >= state.user.xpNextLevel) {
      newLevel += 1;
      currentXpForLevel = newXp - state.user.xpNextLevel;
      newNextLevel = Math.floor(state.user.xpNextLevel * 1.2); // Increase requirement by 20%
    }

    return {
      user: {
        ...state.user,
        xpCurrent: currentXpForLevel,
        xpTotal: newTotalXp,
        level: newLevel,
        xpNextLevel: newNextLevel
      }
    };
  }),

  completeMission: (id) => set((state) => ({
    missions: state.missions.map(m => 
      m.id === id ? { ...m, isCompleted: true, progress: m.total } : m
    ),
    user: {
      ...state.user,
      gems: state.user.gems + (state.missions.find(m => m.id === id)?.gemsReward || 0)
    }
  })),

  addWorkout: (workout) => set((state) => ({
    workouts: [...state.workouts, workout]
  })),

  updateBio: (bio) => set((state) => ({
    user: {
      ...state.user,
      bio: { ...state.user.bio, ...bio }
    }
  })),

  upgradeToPremium: () => set((state) => ({
    user: { ...state.user, isPremium: true }
  }))
}));
