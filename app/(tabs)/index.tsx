/// <reference types="nativewind/types" />
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ScreenContainer, Card, GoldButton } from '../../components/ThemedComponents';
import { ProgressRing } from '../../components/ProgressRing';
import { useGameStore } from '../../store/gameStore';
import { Zap, Gem, Flame, Dumbbell, Droplets, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdBanner } from '../../components/AdBanner';

export default function Dashboard() {
  const { user, missions } = useGameStore();
  const xpPercentage = (user.xpCurrent / user.xpNextLevel) * 100;

  return (
    <ScreenContainer className="pt-14 px-0 pb-0">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
             <Text className="text-gray-400 text-xs uppercase tracking-wide">Bem-vindo de volta</Text>
             <Text className="text-white text-xl font-bold">{user.name}</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-teal-800 items-center justify-center">
             <Text className="text-gold-500 font-bold">🔔</Text>
          </View>
        </View>

        {/* Avatar & Rank */}
        <View className="items-center mb-8">
          <ProgressRing 
            radius={70} 
            stroke={6} 
            progress={xpPercentage} 
            imageUri={user.avatarUrl} 
            level={user.level}
          />
          <Text className="text-2xl font-bold text-white mt-4">{user.rankTitle}</Text>
          <Text className="text-gray-400 text-sm">Próxima evolução em {user.xpNextLevel - user.xpCurrent} XP</Text>
          
          {/* XP Bar */}
          <View className="w-full mt-4">
            <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400 text-xs">XP Atual</Text>
                <Text className="text-gray-400 text-xs">{user.xpCurrent} / {user.xpNextLevel}</Text>
            </View>
            <View className="h-2 bg-teal-900 rounded-full w-full overflow-hidden">
                <View style={{ width: `${xpPercentage}%` }} className="h-full bg-teal-400 rounded-full" />
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View className="flex-row gap-3 mb-8">
            <Card className="flex-1 items-center py-4 bg-teal-900/50">
                <Zap size={24} stroke="#F3DFA2" fill="#F3DFA2" />
                <Text className="text-white font-bold text-lg mt-1">{user.xpTotal}</Text>
                <Text className="text-gray-400 text-[10px] uppercase">XP Total</Text>
            </Card>
            <Card className="flex-1 items-center py-4 bg-teal-900/50">
                <Gem size={24} stroke="#4FD1C5" fill="#4FD1C5" />
                <Text className="text-white font-bold text-lg mt-1">{user.gems}</Text>
                <Text className="text-gray-400 text-[10px] uppercase">Gemas</Text>
            </Card>
            <Card className="flex-1 items-center py-4 bg-teal-900/50">
                <Flame size={24} stroke="#FF9F1C" fill="#FF9F1C" />
                <Text className="text-white font-bold text-lg mt-1">{user.streak}</Text>
                <Text className="text-gray-400 text-[10px] uppercase">Streak</Text>
            </Card>
        </View>

        {/* Bioimpedance */}
        <View className="mb-8">
            <View className="flex-row justify-between items-end mb-4">
                <Text className="text-white text-lg font-bold">Bioimpedância</Text>
                <Text className="text-gold-500 text-xs">Ver Histórico</Text>
            </View>
            
            <View className="flex-row flex-wrap gap-3">
                <Card className="w-[48%] h-32 justify-between border-gold-500/30">
                    <View className="flex-row justify-between">
                         <Text className="text-gray-400 text-xs">Peso</Text>
                         <Activity size={16} stroke="#D4AF37" />
                    </View>
                    <View>
                        <Text className="text-white text-2xl font-bold">{user.bio.weight} <Text className="text-sm font-normal text-gray-400">kg</Text></Text>
                        <Text className="text-red-400 text-xs">↗ +0.5kg</Text>
                    </View>
                </Card>
                <Card className="w-[48%] h-32 justify-between border-teal-500/30">
                     <View className="flex-row justify-between">
                         <Text className="text-gray-400 text-xs">Massa Muscular</Text>
                         <Dumbbell size={16} stroke="#D4AF37" />
                    </View>
                     <View>
                        <Text className="text-white text-2xl font-bold">{user.bio.muscleMass} <Text className="text-sm font-normal text-gray-400">%</Text></Text>
                        <Text className="text-green-400 text-xs">↗ +1.2%</Text>
                    </View>
                </Card>
                <Card className="w-[48%] h-32 justify-between border-blue-500/30">
                     <View className="flex-row justify-between">
                         <Text className="text-gray-400 text-xs">Hidratação</Text>
                         <Droplets size={16} stroke="#60A5FA" />
                    </View>
                     <View>
                        <Text className="text-white text-2xl font-bold">{user.bio.hydration} <Text className="text-sm font-normal text-gray-400">%</Text></Text>
                        <Text className="text-gray-400 text-xs">- Estável</Text>
                    </View>
                </Card>
                 <Card className="w-[48%] h-32 justify-between border-orange-500/30">
                     <View className="flex-row justify-between">
                         <Text className="text-gray-400 text-xs">Gordura</Text>
                         <Activity size={16} stroke="#FB923C" />
                    </View>
                     <View>
                        <Text className="text-white text-2xl font-bold">{user.bio.bodyFat} <Text className="text-sm font-normal text-gray-400">%</Text></Text>
                        <Text className="text-green-400 text-xs">↘ -0.5%</Text>
                    </View>
                </Card>
            </View>
        </View>

        {/* Missions */}
        <View className="mb-8">
             <View className="flex-row justify-between items-end mb-4">
                <Text className="text-white text-lg font-bold">Missões Ativas</Text>
                <View className="bg-teal-800 px-2 py-1 rounded">
                    <Text className="text-white text-xs">3 Novas</Text>
                </View>
            </View>

            {/* Main Mission Card */}
            {missions.length > 0 && (
                <LinearGradient
                    colors={['#4338ca', '#c084fc']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}
                >
                    <View className="flex-row justify-between items-start mb-6">
                         <View className="bg-white/20 p-2 rounded-xl">
                            <Dumbbell stroke="white" size={24} />
                         </View>
                         <View className="bg-gold-500/90 px-3 py-1 rounded-full">
                            <Text className="text-teal-950 text-xs font-bold">+{missions[0].gemsReward} Gold</Text>
                         </View>
                    </View>
                    
                    <Text className="text-white font-bold text-lg mb-1">{missions[0].title}</Text>
                    <Text className="text-white/80 text-sm mb-4">{missions[0].description}</Text>

                    <View className="w-full">
                        <View className="h-2 bg-black/20 rounded-full w-full mb-1">
                            <View style={{ width: `${(missions[0].progress / missions[0].total) * 100}%` }} className="h-full bg-gold-400 rounded-full" />
                        </View>
                        <Text className="text-white/80 text-xs text-right">{missions[0].progress}/{missions[0].total}</Text>
                    </View>
                </LinearGradient>
            )}

             {/* Secondary Mission */}
            {missions.length > 1 && (
                <Card className="flex-row items-center border-l-4 border-l-blue-400">
                    <View className="p-3 bg-blue-500/20 rounded-xl mr-4">
                        <Droplets stroke="#60A5FA" size={20} />
                    </View>
                    <View className="flex-1">
                         <Text className="text-white font-bold">{missions[1].title}</Text>
                         <View className="h-1.5 bg-teal-950 rounded-full w-full mt-2">
                            <View style={{ width: `${(missions[1].progress / missions[1].total) * 100}%` }} className="h-full bg-blue-400 rounded-full" />
                        </View>
                    </View>
                    <Text className="text-gray-400 text-xs ml-2">{missions[1].progress}/{missions[1].total}L</Text>
                </Card>
            )}

        </View>

        {/* Main CTA */}
        <View className="bg-teal-900 rounded-3xl p-5 border border-teal-800">
             <Text className="text-gold-500 text-xs uppercase font-bold tracking-wider mb-2">MISSÃO PRINCIPAL</Text>
             <Text className="text-white text-2xl font-bold mb-4">Treino A: Peito & Tríceps</Text>
             <View className="flex-row gap-4 mb-6">
                <View className="flex-row items-center bg-teal-950 px-3 py-1 rounded-lg">
                    <Activity size={12} stroke="white" />
                    <Text className="text-white text-xs ml-1">45 min</Text>
                </View>
                 <View className="flex-row items-center bg-teal-950 px-3 py-1 rounded-lg">
                    <Flame size={12} stroke="white" />
                    <Text className="text-white text-xs ml-1">Intenso</Text>
                </View>
             </View>
             <GoldButton title="Iniciar Treino" icon={<Text className="text-lg">▶</Text>} />
        </View>

      </ScrollView>
      <View className="mb-[90px]">
        <AdBanner />
      </View>
    </ScreenContainer>
  );
}