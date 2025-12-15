
export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  rankTitle: string;
  xpCurrent: number;
  xpTotal: number;
  xpNextLevel: number;
  gems: number;
  streak: number;
  isPremium: boolean; // Novo campo
  bio: {
    weight: number;
    muscleMass: number;
    bodyFat: number;
    hydration: number;
  };
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  xpReward: number;
  gemsReward: number;
  type: 'daily' | 'weekly' | 'main';
  isCompleted: boolean;
  icon: string;
}

export interface Workout {
  id: string;
  title: string;
  objective: string;
  duration: number;
  intensity: 'Alta' | 'Média' | 'Baixa';
  days: string[];
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
}
