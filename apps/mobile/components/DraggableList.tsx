import React, { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'

// Approximate height of one ListItemRow including margin
const ITEM_H = 72

type Props<T> = {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T, index: number) => React.ReactElement
  onReorder: (fromIndex: number, toIndex: number) => void
  contentContainerStyle?: object
  ListEmptyComponent?: React.ReactElement | null
}

type ItemProps = {
  index: number
  count: number
  draggingIdx: ReturnType<typeof useSharedValue<number>>
  hoverIdx: ReturnType<typeof useSharedValue<number>>
  dragY: ReturnType<typeof useSharedValue<number>>
  onReorder: (from: number, to: number) => void
  children: React.ReactElement
}

function DraggableItem({
  index, count, draggingIdx, hoverIdx, dragY, onReorder, children,
}: ItemProps) {
  const animStyle = useAnimatedStyle(() => {
    const dragging = draggingIdx.value
    const hover = hoverIdx.value

    if (dragging === index) {
      return {
        transform: [{ translateY: dragY.value }],
        zIndex: 100,
        shadowColor: '#7c3aed',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        opacity: 0.95,
      }
    }

    let shift = 0
    if (dragging >= 0 && dragging !== index) {
      if (dragging < hover) {
        // Dragging down — items between [dragging+1 .. hover] shift up
        if (index > dragging && index <= hover) shift = -ITEM_H
      } else if (dragging > hover) {
        // Dragging up — items between [hover .. dragging-1] shift down
        if (index >= hover && index < dragging) shift = ITEM_H
      }
    }

    return {
      transform: [{ translateY: withSpring(shift, { damping: 20, stiffness: 200 }) }],
      zIndex: 1,
    }
  })

  const gesture = useMemo(() =>
    Gesture.Pan()
      .activateAfterLongPress(300)
      .onStart(() => {
        draggingIdx.value = index
        hoverIdx.value = index
        dragY.value = 0
      })
      .onUpdate((e) => {
        dragY.value = e.translationY
        hoverIdx.value = Math.max(0, Math.min(count - 1,
          Math.round(index + e.translationY / ITEM_H)
        ))
      })
      .onEnd(() => {
        const from = draggingIdx.value
        const to = hoverIdx.value
        dragY.value = withSpring(0, { damping: 20 })
        draggingIdx.value = -1
        hoverIdx.value = -1
        if (from >= 0 && from !== to) {
          runOnJS(onReorder)(from, to)
        }
      })
      .onFinalize(() => {
        if (draggingIdx.value >= 0) {
          dragY.value = withSpring(0, { damping: 20 })
          draggingIdx.value = -1
          hoverIdx.value = -1
        }
      }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [index, count])

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}

export function DraggableList<T>({
  data, keyExtractor, renderItem, onReorder,
  contentContainerStyle, ListEmptyComponent,
}: Props<T>) {
  const draggingIdx = useSharedValue(-1)
  const hoverIdx = useSharedValue(-1)
  const dragY = useSharedValue(0)

  if (data.length === 0) {
    return ListEmptyComponent ?? null
  }

  return (
    <ScrollView contentContainerStyle={contentContainerStyle}>
      {data.map((item, index) => (
        <DraggableItem
          key={keyExtractor(item)}
          index={index}
          count={data.length}
          draggingIdx={draggingIdx}
          hoverIdx={hoverIdx}
          dragY={dragY}
          onReorder={onReorder}
        >
          {renderItem(item, index)}
        </DraggableItem>
      ))}
    </ScrollView>
  )
}
