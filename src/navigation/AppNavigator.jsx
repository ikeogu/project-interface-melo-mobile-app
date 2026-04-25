import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

import SplashScreen from '../screens/SplashScreen';
import EmailScreen from '../screens/EmailScreen';
import OTPScreen from '../screens/OTPScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ChatScreen from '../screens/ChatScreen';
import CreateContactScreen from '../screens/CreateContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import NewChatScreen from '../screens/NewChatScreen';
import GroupTemplatesScreen from '../screens/GroupTemplatesScreen';
import VoiceCallScreen from '../screens/VoiceCallScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Contacts: focused ? 'people' : 'people-outline',
    Chats: focused ? 'chatbubbles' : 'chatbubbles-outline',
    Me: focused ? 'person-circle' : 'person-circle-outline',
  };
  return (
    <Ionicons
      name={icons[name]}
      size={24}
      color={focused ? Colors.tabActive : Colors.tabInactive}
    />
  );
}

function ContactsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ContactsList" component={ContactsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CreateContact" component={CreateContactScreen} />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="VoiceCall"
        component={VoiceCallScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

function ChatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatsList" component={ChatsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="NewChat" component={NewChatScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupTemplates" component={GroupTemplatesScreen} />
      <Stack.Screen
        name="VoiceCall"
        component={VoiceCallScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          backgroundColor: Colors.background,
          height: 80,
          paddingBottom: 20,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      })}
    >
      <Tab.Screen name="Contacts" component={ContactsStack} />
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="Me" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Email" component={EmailScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          </>
        ) : !user?.is_profile_complete ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
