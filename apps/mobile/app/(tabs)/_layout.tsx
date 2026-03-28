import { Tabs } from 'expo-router'
import { Mic, FileText, List, Clock, Settings } from 'lucide-react-native'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0a0a0a',
        borderTopColor: '#1a1a1a',
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: '#a78bfa',
      tabBarInactiveTintColor: '#444',
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Szepter', tabBarIcon: ({ color }) => <Mic size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: 'Notatki', tabBarIcon: ({ color }) => <FileText size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="lists"
        options={{ title: 'Listy', tabBarIcon: ({ color }) => <List size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Historia', tabBarIcon: ({ color }) => <Clock size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ustawienia', tabBarIcon: ({ color }) => <Settings size={22} color={color} /> }}
      />
    </Tabs>
  )
}