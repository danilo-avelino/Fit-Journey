/// <reference types="nativewind/types" />
import { View, Text, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { GoldButton } from '../components/ThemedComponents';
import { LinearGradient } from 'expo-linear-gradient';

export default function Onboarding() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-teal-950 relative">
       {/* Background Image Placeholder - using Gradient instead for robustness if image fails */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' }}
        className="flex-1"
        resizeMode="cover"
      >
         {/* Overlay to darken image and blend to teal */}
        <LinearGradient
            colors={['transparent', '#05161A']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.5, y: 0.9 }}
        />

        <View className="flex-1 justify-end px-6 pb-12">
            <View className="items-center mb-10">
                <Text className="text-teal-400 font-bold tracking-[4px] mb-2 uppercase text-sm">Bem-vindo ao</Text>
                <Text className="text-5xl font-extrabold text-white text-center mb-4">
                    Fit<Text className="text-gold-500">Journey</Text>
                </Text>
                <Text className="text-gray-300 text-center text-lg leading-6 px-4">
                    Sua jornada de força e evolução começa agora. Transforme cada gota de suor em XP.
                </Text>
            </View>

            <View className="w-full space-y-4 gap-4">
                <GoldButton 
                    title="Começar Agora" 
                    onPress={() => router.push('/(auth)/signup')} 
                />
                
                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-400">Já tem uma conta? </Text>
                    <Text 
                        onPress={() => router.push('/(auth)/login')}
                        className="text-gold-500 font-bold"
                    >
                        Entrar
                    </Text>
                </View>
            </View>
        </View>
      </ImageBackground>
    </View>
  );
}