import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GoldButton, ScreenContainer, ThemedInput } from '../../components/ThemedComponents';

export default function Signup() {
  const router = useRouter();

  const handleSignup = () => {
    // In a real app, handle signup logic here
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center mb-8 mt-4" style={{ alignItems: 'center', marginBottom: 32, marginTop: 16 }}>
            <Text className="text-3xl font-bold text-white mb-2" style={{ fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>Crie sua Conta</Text>
            <Text className="text-gray-400 text-center" style={{ color: '#9CA3AF', textAlign: 'center' }}>Junte-se à elite e comece sua jornada.</Text>
        </View>

        <View className="w-full space-y-4" style={{ width: '100%', gap: 16 }}>
            <ThemedInput label="Nome Completo" placeholder="Ex: João Silva" />
            <ThemedInput label="Email" placeholder="seu@email.com" keyboardType="email-address" />
            <ThemedInput label="Senha" placeholder="Mínimo 8 caracteres" secureTextEntry />
            <ThemedInput label="Confirmar Senha" placeholder="Repita a senha" secureTextEntry />
            
            <View className="mt-4" style={{ marginTop: 16 }}>
                <GoldButton title="Criar Conta" onPress={handleSignup} />
            </View>

            <View className="flex-row justify-center mt-6" style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <Text className="text-gray-400" style={{ color: '#9CA3AF' }}>Já possui conta? </Text>
                <Text 
                    onPress={() => router.back()}
                    className="text-gold-500 font-bold"
                    style={{ color: '#D4AF37', fontWeight: 'bold' }}
                >
                    Entrar
                </Text>
            </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}