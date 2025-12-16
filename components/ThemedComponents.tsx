import React from 'react';
import { TouchableOpacity, Text, View, ViewProps, TextInput, TouchableOpacityProps, TextInputProps } from 'react-native';
import { clsx } from 'clsx';
import { LinearGradient } from 'expo-linear-gradient';

// Screen Container with Dark Teal Gradient Background
export const ScreenContainer: React.FC<ViewProps & { className?: string }> = ({ children, className, ...props }) => {
  return (
    <View className={clsx("flex-1 bg-teal-950", className)} style={{ flex: 1, backgroundColor: '#05161A' }} {...props}>
      <LinearGradient
        colors={['#0B1E26', '#05161A']}
        style={{ flex: 1 }}
      >
        <View className={clsx("flex-1 px-5 pt-12", className)} style={{ flex: 1, paddingHorizontal: 20, paddingTop: 48 }}>
            {children}
        </View>
      </LinearGradient>
    </View>
  );
};

// Gold CTA Button
export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  className?: string;
  onPress?: TouchableOpacityProps['onPress'];
}

export const GoldButton: React.FC<ButtonProps> = ({ title, variant = 'primary', icon, className, ...props }) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity 
        className={clsx("w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-gold-500/20", className)}
        style={{ width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}
        {...props}
      >
        <LinearGradient
          colors={['#F3DFA2', '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
        >
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text className="text-teal-950 font-bold text-lg uppercase tracking-wider" style={{ color: '#05161A', fontWeight: 'bold', fontSize: 18, letterSpacing: 1.5 }}>{title}</Text>
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
      style={{ width: '100%', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: variant === 'outline' ? 1 : 0, borderColor: variant === 'outline' ? '#D4AF37' : 'transparent' }}
      {...props}
    >
      <Text 
        className={clsx("font-bold text-lg", variant === 'outline' ? "text-gold-500" : "text-gray-400")}
        style={{ color: variant === 'outline' ? '#D4AF37' : '#9CA3AF', fontWeight: 'bold', fontSize: 18 }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Standard Card with Gold Border/Glow
export const Card: React.FC<ViewProps & { className?: string }> = ({ children, className, ...props }) => {
  return (
    <View 
      className={clsx("bg-teal-900/80 border border-teal-800 rounded-3xl p-4 backdrop-blur-sm", className)}
      style={{ backgroundColor: 'rgba(11, 30, 38, 0.8)', borderColor: '#12303B', borderWidth: 1, borderRadius: 24, padding: 16 }}
      {...props}
    >
      {children}
    </View>
  );
};

// Input Field
export interface InputProps extends TextInputProps {
  label?: string;
  className?: string;
  placeholder?: TextInputProps['placeholder'];
  value?: TextInputProps['value'];
  onChangeText?: TextInputProps['onChangeText'];
  secureTextEntry?: TextInputProps['secureTextEntry'];
  keyboardType?: TextInputProps['keyboardType'];
}

export const ThemedInput: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <View className="mb-4 w-full" style={{ marginBottom: 16, width: '100%' }}>
      {label && <Text className="text-gray-400 mb-2 ml-1 text-sm font-medium" style={{ color: '#9CA3AF', marginBottom: 8, marginLeft: 4, fontSize: 14, fontWeight: '500' }}>{label}</Text>}
      <View className="h-14 border border-teal-800 bg-teal-900/50 rounded-2xl px-4 justify-center" style={{ height: 56, borderWidth: 1, borderColor: '#12303B', backgroundColor: 'rgba(11, 30, 38, 0.5)', borderRadius: 16, paddingHorizontal: 16, justifyContent: 'center' }}>
        <TextInput 
          placeholderTextColor="#64748B"
          className={clsx("text-white text-base", className)}
          style={{ color: '#FFFFFF', fontSize: 16 }}
          {...props}
        />
      </View>
    </View>
  );
};