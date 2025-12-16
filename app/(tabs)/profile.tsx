import React from 'react';
import { View, Text, ScrollView, Switch, Image, TouchableOpacity } from 'react-native';
import { ScreenContainer, Card, GoldButton } from '../../components/ThemedComponents';
import { useGameStore } from '../../store/gameStore';
import { User, Settings, Award, LogOut, ChevronRight, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user } = useGameStore();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View className="items-center mb-6 relative">
        <View className="w-24 h-24 rounded-full border-4 border-gold-500 overflow-hidden mb-4">
             <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
        </View>
        
        {user.isPremium && (
            <View className="absolute top-0 right-[35%] bg-gold-500 rounded-full p-1 border-2 border-teal-950">
                <Crown size={16} fill="black" stroke="black" />
            </View>
        )}

        <Text className="text-2xl font-bold text-white">{user.name}</Text>
        <Text className="text-gold-500 mb-2">{user.rankTitle} • Nível {user.level}</Text>
        
        {user.isPremium ? (
             <View className="bg-gold-500/20 px-3 py-1 rounded-full border border-gold-500">
                <Text className="text-gold-500 font-bold text-xs">Membro Premium</Text>
             </View>
        ) : (
             <View className="bg-gray-700 px-3 py-1 rounded-full">
                <Text className="text-gray-300 font-bold text-xs">Membro Grátis</Text>
             </View>
        )}
      </View>

      {!user.isPremium && (
        <TouchableOpacity onPress={() => router.push('/premium')}>
            <LinearGradient
                colors={['#F3DFA2', '#D4AF37']}
                style={{ borderRadius: 16, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View>
                    <Text className="text-teal-950 font-bold text-lg">Seja Premium</Text>
                    <Text className="text-teal-900 text-xs">Remova anúncios e ganhe XP em dobro.</Text>
                </View>
                <View className="bg-teal-950 w-8 h-8 rounded-full items-center justify-center">
                    <Crown size={16} stroke="#D4AF37" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={{ gap: 12 }}>
         <Card className="flex-row items-center p-4">
            <User size={20} stroke="#D4AF37" />
            <Text className="text-white flex-1 ml-4 font-bold">Conta</Text>
            <ChevronRight size={20} stroke="gray" />
         </Card>

         <Card className="flex-row items-center p-4">
            <Award size={20} stroke="#D4AF37" />
            <Text className="text-white flex-1 ml-4 font-bold">Conquistas</Text>
            <ChevronRight size={20} stroke="gray" />
         </Card>

         <Card className="flex-row items-center p-4">
            <Settings size={20} stroke="#D4AF37" />
            <Text className="text-white flex-1 ml-4 font-bold">Configurações</Text>
            <ChevronRight size={20} stroke="gray" />
         </Card>
         
         <View className="mt-8">
            <GoldButton title="Sair" variant="outline" icon={<LogOut size={20} stroke="#D4AF37" />} />
         </View>
      </ScrollView>
    </ScreenContainer>
  );
}