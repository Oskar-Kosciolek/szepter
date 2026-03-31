import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, ViewStyle } from 'react-native'

type Props = {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function SkeletonBox({ width = '100%', height = 20, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View
      style={[
        s.box,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  )
}

export function NoteCardSkeleton() {
  return (
    <View style={s.card}>
      <SkeletonBox height={14} width="60%" borderRadius={6} style={{ marginBottom: 8 }} />
      <SkeletonBox height={12} width="90%" borderRadius={6} style={{ marginBottom: 4 }} />
      <SkeletonBox height={12} width="75%" borderRadius={6} />
    </View>
  )
}

export function ListCardSkeleton() {
  return (
    <View style={s.card}>
      <SkeletonBox height={16} width="50%" borderRadius={6} style={{ marginBottom: 8 }} />
      <SkeletonBox height={12} width="35%" borderRadius={6} />
    </View>
  )
}

export function SkeletonList({ count = 4, type = 'note' }: { count?: number; type?: 'note' | 'list' }) {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        type === 'note'
          ? <NoteCardSkeleton key={i} />
          : <ListCardSkeleton key={i} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  box:  { backgroundColor: '#2a2a2a' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
})
