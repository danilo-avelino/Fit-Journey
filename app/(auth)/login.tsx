import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { GoldButton, ScreenContainer, ThemedInput } from '../../components/ThemedComponents';
import { Lock, Mail } from 'lucide-react-native';

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, validate with Supabase here
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer className="justify-center">
      <View className="items-center mb-12" style={{ alignItems: 'center', marginBottom: 48, marginTop: 60 }}>
        <View className="w-24 h-24 rounded-full border-4 border-teal-500 items-center justify-center mb-6 overflow-hidden" style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: '#2A9D8F', marginBottom: 24, overflow: 'hidden' }}>
             <Image source={{ uri: 'https://picsum.photos/200' }} style={{ width: '100%', height: '100%' }} />
        </View>
        <Text className="text-3xl font-bold text-white mb-2" style={{ fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>Bem-vindo, Campeão</Text>
        <Text className="text-teal-400" style={{ color: '#4FD1C5' }}>Entre para continuar sua evolução</Text>
      </View>

      <View className="w-full">
        <ThemedInput placeholder="Email ou Usuário" keyboardType="email-address" />
        <ThemedInput placeholder="Senha" secureTextEntry />
        
        <View className="flex-row justify-between items-center mb-8" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
            <Text className="text-gray-400 text-sm" style={{ color: '#9CA3AF', fontSize: 14 }}>Lembrar-me</Text>
            <Text className="text-gold-500 text-sm font-bold" style={{ color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }}>Esqueceu a senha?</Text>
        </View>

        <GoldButton title="Entrar" onPress={handleLogin} />

        <View className="mt-8 items-center" style={{ marginTop: 32, alignItems: 'center' }}>
            <Text className="text-gray-500 mb-4" style={{ color: '#6B7280', marginBottom: 16 }}>Ou entre com</Text>
            <View className="flex-row gap-6" style={{ flexDirection: 'row', gap: 24 }}>
                {/* Social Placeholders */}
                <View style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: 'bold', color: 'black' }}>G</Text></View>
                <View style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: 'bold', color: 'black' }}>A</Text></View>
            </View>
        </View>
      </View>
    </ScreenContainer>
  );
}