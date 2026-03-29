import { Text, StyleSheet } from 'react-native'

type Props = {
  message: string
}

export function EmptyState({ message }: Props) {
  return <Text style={s.empty}>{message}</Text>
}

const s = StyleSheet.create({
  empty: { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 15 },
})
