import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Dumbbell, Users, User, ShoppingBag } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B1E26',
          borderTopWidth: 0,
          height: 90,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
            fontSize: 10,
            marginBottom: 10,
            fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Treino',
          tabBarIcon: ({ color }) => <Dumbbell size={24} stroke={color} />,
        }}
      />
      
      {/* Central Floating Button */}
      <Tabs.Screen
        name="center"
        options={{
          title: '',
          tabBarIcon: () => (
            <View 
                style={{
                    width: 64, 
                    height: 64, 
                    backgroundColor: '#D4AF37', 
                    borderRadius: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginTop: -32,
                    borderWidth: 4,
                    borderColor: '#0B1E26',
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4.65,
                    elevation: 8
                }}
            >
              <User size={32} stroke="#0B1E26" fill="#0B1E26" />
            </View>
          ),
        }}
        listeners={() => ({
            tabPress: (e: any) => {
                e.preventDefault();
                // Could open a quick action menu here
            }
        })}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: 'Loja',
          tabBarIcon: ({ color }) => <ShoppingBag size={24} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Users size={24} stroke={color} />,
        }}
      />
    </Tabs>
  );
}