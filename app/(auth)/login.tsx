/// <reference types="nativewind/types" />
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
      <View className="items-center mb-12">
        <View className="w-24 h-24 rounded-full border-4 border-teal-500 items-center justify-center mb-6 overflow-hidden">
             <Image source={{ uri: 'https://picsum.photos/200' }} className="w-full h-full" />
        </View>
        <Text className="text-3xl font-bold text-white mb-2">Bem-vindo, Campeão</Text>
        <Text className="text-teal-400">Entre para continuar sua evolução</Text>
      </View>

      <View className="w-full">
        <ThemedInput placeholder="Email ou Usuário" keyboardType="email-address" />
        <ThemedInput placeholder="Senha" secureTextEntry />
        
        <View className="flex-row justify-between items-center mb-8">
            <Text className="text-gray-400 text-sm">Lembrar-me</Text>
            <Text className="text-gold-500 text-sm font-bold">Esqueceu a senha?</Text>
        </View>

        <GoldButton title="Entrar" onPress={handleLogin} />

        <View className="mt-8 items-center">
            <Text className="text-gray-500 mb-4">Ou entre com</Text>
            <View className="flex-row gap-6">
                {/* Social Placeholders */}
                <View className="w-12 h-12 bg-white rounded-full items-center justify-center"><Text className="font-bold text-black">G</Text></View>
                <View className="w-12 h-12 bg-white rounded-full items-center justify-center"><Text className="font-bold text-black">A</Text></View>
            </View>
        </View>
      </View>
    </ScreenContainer>
  );
}