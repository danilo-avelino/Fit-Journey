import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, GoldButton, Card } from '../components/ThemedComponents';
import { useGameStore } from '../store/gameStore';
import { Check, X, Crown, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PremiumScreen() {
  const router = useRouter();
  const { upgradeToPremium } = useGameStore();

  const handlePurchase = () => {
    // In a real app, verify purchase with StoreKit/RevenueCat here
    upgradeToPremium();
    router.back();
  };

  return (
    <ScreenContainer className="px-0 pt-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Hero */}
        <View className="h-64 relative items-center justify-center mb-6">
            <LinearGradient
                colors={['#D4AF37', '#0B1E26']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
            <View className="w-24 h-24 bg-teal-950 rounded-full items-center justify-center mb-4 border-4 border-white/20">
                <Crown size={48} stroke="#D4AF37" fill="#D4AF37" />
            </View>
            <Text className="text-3xl font-extrabold text-white text-center">FitJourney <Text className="text-gold-500">PRO</Text></Text>
        </View>

        <View className="px-6">
            <Text className="text-gray-300 text-center mb-8 text-lg">
                Desbloqueie seu potencial máximo e remova distrações.
            </Text>

            {/* Pricing Card */}
            <Card className="border-gold-500 bg-teal-900/90 mb-8 overflow-hidden relative">
                <View className="absolute top-0 right-0 bg-gold-500 px-3 py-1 rounded-bl-xl">
                    <Text className="text-teal-950 font-bold text-xs">POPULAR</Text>
                </View>
                
                <Text className="text-white text-center text-sm uppercase tracking-widest mb-2">Assinatura Mensal</Text>
                <View className="flex-row justify-center items-end mb-4">
                    <Text className="text-gold-500 text-2xl font-bold mb-1">R$ </Text>
                    <Text className="text-white text-5xl font-bold">9,99</Text>
                    <Text className="text-gray-400 text-xl mb-1">/mês</Text>
                </View>

                <GoldButton 
                    title="ASSINAR AGORA" 
                    onPress={handlePurchase}
                    className="mb-2"
                />
                <Text className="text-center text-gray-500 text-xs">Cancele quando quiser.</Text>
            </Card>

            {/* Features List */}
            <View className="gap-4 mb-8">
                <FeatureRow text="Remover todos os anúncios" isPro />
                <FeatureRow text="Ganhe 50% a mais de XP" isPro />
                <FeatureRow text="Emblema exclusivo no perfil" isPro />
                <FeatureRow text="Estatísticas avançadas" isPro />
                <FeatureRow text="Suporte prioritário" isPro />
            </View>

            <TouchableOpacity onPress={() => router.back()} className="items-center py-4">
                <Text className="text-gray-500 font-bold">Talvez depois</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const FeatureRow = ({ text, isPro }: { text: string, isPro?: boolean }) => (
    <View className="flex-row items-center justify-between border-b border-teal-800 pb-3">
        <Text className="text-gray-300 flex-1 text-base">{text}</Text>
        {isPro ? (
            <View className="bg-gold-500/20 p-1 rounded-full">
                <Check size={16} stroke="#D4AF37" strokeWidth={3} />
            </View>
        ) : (
            <X size={16} stroke="gray" />
        )}
    </View>
);