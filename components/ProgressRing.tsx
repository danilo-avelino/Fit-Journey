/// <reference types="nativewind/types" />
import React from 'react';
import { View, Text, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number; // 0 to 100
  imageUri: string;
  level: number;
}

export const ProgressRing = ({ radius, stroke, progress, imageUri, level }: ProgressRingProps) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View className="items-center justify-center relative">
      <View style={{ width: radius * 2, height: radius * 2 }} className="relative items-center justify-center">
        <Svg height={radius * 2} width={radius * 2} className="absolute rotate-[-90deg]">
          {/* Background Circle */}
          <Circle
            stroke="#12303B"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Circle */}
          <Circle
            stroke="#4FD1C5" // Teal Bright
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </Svg>
        
        {/* Avatar Image */}
        <View 
          style={{ width: (radius * 2) - 20, height: (radius * 2) - 20, borderRadius: radius }} 
          className="overflow-hidden border-4 border-teal-900"
        >
          <Image 
            source={{ uri: imageUri }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Level Badge */}
        <View className="absolute -bottom-2 bg-teal-950 px-3 py-1 rounded-full border border-teal-500 items-center">
            <Text className="text-teal-400 text-[10px] font-bold uppercase">Nível</Text>
            <Text className="text-white text-lg font-bold leading-5">{level}</Text>
        </View>
      </View>
    </View>
  );
};