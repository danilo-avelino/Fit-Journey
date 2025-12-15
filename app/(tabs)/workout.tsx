
/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer, GoldButton, Card, ThemedInput } from '../../components/ThemedComponents';
import { Plus, Trash2, Calendar, Dumbbell } from 'lucide-react-native';
import { useGameStore } from '../../store/gameStore';
import { AdBanner } from '../../components/AdBanner';

export default function WorkoutScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const { workouts, addWorkout } = useGameStore();

  const [newWorkoutName, setNewWorkoutName] = useState('');
  
  // Dummy implementation for adding a workout
  const handleSaveWorkout = () => {
    if (!newWorkoutName) return;
    addWorkout({
        id: Math.random().toString(),
        title: newWorkoutName,
        objective: 'Hipertrofia',
        days: ['Seg', 'Qui'],
        duration: 60,
        intensity: 'Alta',
        exercises: []
    });
    setNewWorkoutName('');
    setIsCreating(false);
  };

  if (isCreating) {
    return (
        <ScreenContainer>
            <View className="flex-row items-center mb-6">
                <TouchableOpacity onPress={() => setIsCreating(false)} className="p-2 mr-2">
                    <Text className="text-white text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white">Criar Treino</Text>
            </View>

            <ScrollView>
                <Text className="text-gold-500 mb-2 font-bold">Nome do Treino</Text>
                <ThemedInput 
                    value={newWorkoutName} 
                    onChangeText={setNewWorkoutName} 
                    placeholder="Ex: Treino A - Peito" 
                />

                <Text className="text-gold-500 mb-2 font-bold mt-4">Objetivo</Text>
                <View className="flex-row gap-3 mb-6">
                    <TouchableOpacity className="bg-gold-500/20 border border-gold-500 p-4 rounded-xl items-center flex-1">
                        <Dumbbell stroke="#D4AF37" size={24} />
                        <Text className="text-gold-500 font-bold mt-2">Força</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-teal-900 border border-teal-800 p-4 rounded-xl items-center flex-1">
                         <Text className="text-2xl">💪</Text>
                        <Text className="text-gray-400 font-bold mt-2">Hipertrofia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-teal-900 border border-teal-800 p-4 rounded-xl items-center flex-1">
                         <Text className="text-2xl">🏃</Text>
                        <Text className="text-gray-400 font-bold mt-2">Cardio</Text>
                    </TouchableOpacity>
                </View>

                <Text className="text-gold-500 mb-2 font-bold">Seleção de Exercícios</Text>
                
                <Card className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <View className="bg-teal-800 p-2 rounded-lg mr-3">
                            <Text className="text-white font-bold">H</Text>
                        </View>
                        <Text className="text-white font-bold">Supino Reto</Text>
                    </View>
                    <TouchableOpacity className="bg-gold-500 rounded-full w-8 h-8 items-center justify-center">
                        <Plus size={16} stroke="#000" />
                    </TouchableOpacity>
                </Card>

                 <Card className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <View className="bg-teal-800 p-2 rounded-lg mr-3">
                            <Text className="text-white font-bold">H</Text>
                        </View>
                        <Text className="text-white font-bold">Tríceps Corda</Text>
                    </View>
                    <TouchableOpacity className="bg-gold-500 rounded-full w-8 h-8 items-center justify-center">
                        <Plus size={16} stroke="#000" />
                    </TouchableOpacity>
                </Card>

            </ScrollView>
            
            <View className="pb-8">
                 <GoldButton title="Salvar Treino" onPress={handleSaveWorkout} />
            </View>
        </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="pb-0">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-bold text-white">Meus Treinos</Text>
        <TouchableOpacity 
            onPress={() => setIsCreating(true)}
            className="w-10 h-10 bg-gold-500 rounded-xl items-center justify-center"
        >
            <Plus stroke="#0B1E26" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 100 }}>
        {workouts.length === 0 && (
            <View className="items-center py-10 opacity-50">
                <Dumbbell size={64} stroke="white" />
                <Text className="text-white mt-4">Nenhum treino criado ainda.</Text>
            </View>
        )}

        {workouts.map((workout) => (
             <Card key={workout.id} className="border-l-4 border-l-gold-500">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-white font-bold text-lg">{workout.title}</Text>
                        <Text className="text-gray-400 text-xs mt-1">{workout.objective} • {workout.duration} min</Text>
                        <View className="flex-row mt-3 gap-2">
                            {workout.days.map(d => (
                                <View key={d} className="bg-teal-950 px-2 py-1 rounded text-xs">
                                    <Text className="text-teal-400 text-[10px]">{d}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Text className="text-gold-500 text-sm font-bold">Editar</Text>
                    </TouchableOpacity>
                </View>
            </Card>
        ))}

        {/* Hardcoded Logs for UI Demo */}
        <Card className="border-l-4 border-l-gold-500">
            <View className="flex-row justify-between items-start">
                <View>
                    <Text className="text-white font-bold text-lg">Treino A: Peito & Tríceps</Text>
                    <Text className="text-gray-400 text-xs mt-1">Hipertrofia • 45 min</Text>
                    <View className="flex-row mt-3 gap-2">
                        <View className="bg-teal-950 px-2 py-1 rounded text-xs">
                            <Text className="text-teal-400 text-[10px]">Seg</Text>
                        </View>
                         <View className="bg-teal-950 px-2 py-1 rounded text-xs">
                            <Text className="text-teal-400 text-[10px]">Qui</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity>
                    <Text className="text-gold-500 text-sm font-bold">Editar</Text>
                </TouchableOpacity>
            </View>
        </Card>
      </ScrollView>
      <View className="mb-[90px]">
        <AdBanner />
      </View>
    </ScreenContainer>
  );
}
