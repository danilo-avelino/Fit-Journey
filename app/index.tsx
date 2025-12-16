import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { GoldButton } from '../components/ThemedComponents';
import { LinearGradient } from 'expo-linear-gradient';

export default function Onboarding() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-teal-950 relative" style={{ flex: 1, backgroundColor: '#05161A' }}>
       {/* Background Image Placeholder */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' }}
        className="flex-1"
        style={{ flex: 1, backgroundColor: '#05161A' }}
        resizeMode="cover"
      >
         {/* Overlay to darken image and blend to teal */}
        <LinearGradient
            colors={['transparent', '#05161A']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.5, y: 0.9 }}
        />

        <View className="flex-1 justify-end px-6 pb-12" style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 48 }}>
            <View className="items-center mb-10" style={{ alignItems: 'center', marginBottom: 40 }}>
                <Text className="text-teal-400 font-bold tracking-[4px] mb-2 uppercase text-sm" style={{ color: '#4FD1C5', fontWeight: 'bold', letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase', fontSize: 14 }}>Bem-vindo ao</Text>
                <Text className="text-5xl font-extrabold text-white text-center mb-4" style={{ fontSize: 48, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 16 }}>
                    Fit<Text className="text-gold-500" style={{ color: '#D4AF37' }}>Journey</Text>
                </Text>
                <Text className="text-gray-300 text-center text-lg leading-6 px-4" style={{ color: '#D1D5DB', textAlign: 'center', fontSize: 18, lineHeight: 24, paddingHorizontal: 16 }}>
                    Sua jornada de força e evolução começa agora. Transforme cada gota de suor em XP.
                </Text>
            </View>

            <View className="w-full space-y-4 gap-4" style={{ width: '100%', gap: 16 }}>
                <GoldButton 
                    title="Começar Agora" 
                    onPress={() => router.push('/(auth)/signup')} 
                />
                
                <View className="flex-row justify-center mt-4" style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
                    <Text className="text-gray-400" style={{ color: '#9CA3AF' }}>Já tem uma conta? </Text>
                    <Text 
                        onPress={() => router.push('/(auth)/login')}
                        className="text-gold-500 font-bold"
                        style={{ color: '#D4AF37', fontWeight: 'bold' }}
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