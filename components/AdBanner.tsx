import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../store/gameStore';

export const AdBanner = () => {
  const { user } = useGameStore();

  // If user is premium, do not show ads
  if (user.isPremium) {
    return null;
  }

  return (
    <View className="w-full h-[60px] bg-gray-900 items-center justify-center border-t border-gray-800">
      <View className="flex-row items-center gap-2">
        <View className="bg-white px-1 rounded">
          <Text className="text-[10px] font-bold text-black">AD</Text>
        </View>
        <Text className="text-gray-400 text-xs">Publicidade: Suplementos em Promoção</Text>
      </View>
    </View>
  );
};