/// <reference types="nativewind/types" />
import React from 'react';
import { TouchableOpacity, Text, View, ViewProps, TextInput } from 'react-native';
import { clsx } from 'clsx';
import { LinearGradient } from 'expo-linear-gradient';

// Screen Container with Dark Teal Gradient Background
export const ScreenContainer = ({ children, className }: ViewProps & { className?: string }) => {
  return (
    <View className="flex-1 bg-teal-950">
      <LinearGradient
        colors={['#0B1E26', '#05161A']}
        style={{ flex: 1 }}
      >
        <View className={clsx("flex-1 px-5 pt-12", className)}>
            {children}
        </View>
      </LinearGradient>
    </View>
  );
};

// Gold CTA Button
interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  className?: string;
}

export const GoldButton = ({ title, variant = 'primary', icon, className, ...props }: ButtonProps) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity 
        className={clsx("w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-gold-500/20", className)}
        {...props}
      >
        <LinearGradient
          colors={['#F3DFA2', '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
        >
          {icon && <View className="mr-2">{icon}</View>}
          <Text className="text-teal-950 font-bold text-lg uppercase tracking-wider">{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      className={clsx(
        "w-full h-14 rounded-2xl items-center justify-center border",
        variant === 'outline' ? "border-gold-500 bg-transparent" : "border-transparent bg-transparent",
        className
      )}
      {...props}
    >
      <Text className={clsx("font-bold text-lg", variant === 'outline' ? "text-gold-500" : "text-gray-400")}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Standard Card with Gold Border/Glow
export const Card = ({ children, className }: ViewProps & { className?: string }) => {
  return (
    <View className={clsx("bg-teal-900/80 border border-teal-800 rounded-3xl p-4 backdrop-blur-sm", className)}>
      {children}
    </View>
  );
};

// Input Field
interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  className?: string;
}

export const ThemedInput = ({ label, className, ...props }: InputProps) => {
  return (
    <View className="mb-4 w-full">
      {label && <Text className="text-gray-400 mb-2 ml-1 text-sm font-medium">{label}</Text>}
      <View className="h-14 border border-teal-800 bg-teal-900/50 rounded-2xl px-4 justify-center">
        <TextInput 
          placeholderTextColor="#64748B"
          className={clsx("text-white text-base", className)}
          {...props}
        />
      </View>
    </View>
  );
};