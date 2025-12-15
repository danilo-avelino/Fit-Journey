
/// <reference types="nativewind/types" />
import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { ScreenContainer, Card, GoldButton } from '../../components/ThemedComponents';
import { ShoppingBag, Tag } from 'lucide-react-native';
import { AdBanner } from '../../components/AdBanner';

export default function ShopScreen() {
  return (
    <ScreenContainer className="pb-0">
       <View className="flex-row items-center mb-6">
           <ShoppingBag stroke="#D4AF37" size={28} />
           <Text className="text-2xl font-bold text-white ml-2">Loja de Parceiros</Text>
       </View>

       <View className="bg-gradient-to-r from-teal-500 to-teal-900 rounded-2xl p-4 mb-6 relative overflow-hidden h-40 justify-center">
            {/* Promo Banner */}
            <View className="z-10">
                <Text className="text-white font-bold text-xl">Kit Evolução Goddess</Text>
                <Text className="text-white/80 text-xs mb-3 w-2/3">Whey + Creatina + BCAA com 20% OFF na Growth.</Text>
                <View className="bg-gold-500 px-4 py-2 rounded-lg self-start">
                    <Text className="text-teal-950 font-bold text-xs">VER OFERTA</Text>
                </View>
            </View>
            <Image 
                source={{ uri: 'https://picsum.photos/200' }} 
                className="absolute -right-4 top-0 w-40 h-full opacity-80" 
                resizeMode="cover"
            />
       </View>

       <Text className="text-white font-bold mb-4 text-lg">Destaques da Semana</Text>
       
       <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="w-[48%] mb-4 p-0 overflow-hidden bg-white">
                    <View className="h-32 bg-gray-100 items-center justify-center">
                        <Image source={{ uri: `https://picsum.photos/seed/${i}/200` }} className="w-full h-full" resizeMode="cover" />
                        <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded text-xs">
                             <Text className="text-white font-bold text-[10px]">-15%</Text>
                        </View>
                    </View>
                    <View className="p-3 bg-white">
                        <Text className="text-teal-950 font-bold text-sm mb-1">Whey Protein Isolado</Text>
                        <View className="flex-row items-center gap-1 mb-2">
                             <Tag size={12} stroke="gray" />
                             <Text className="text-gray-500 text-xs">Growth</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-teal-600 font-bold">R$ 126,90</Text>
                            <View className="bg-gold-500 rounded-full w-6 h-6 items-center justify-center">
                                <Text className="text-white">+</Text>
                            </View>
                        </View>
                    </View>
                </Card>
            ))}
        </View>
       </ScrollView>
       <View className="mb-[90px]">
        <AdBanner />
       </View>
    </ScreenContainer>
  );
}
