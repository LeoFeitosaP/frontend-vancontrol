import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { C, Label } from './ui';

// Edite aqui os textos das notificações (na ordem em que aparecem).
const NOTIFICATIONS = [
  { title: 'Sua van saiu do terminal', body: 'Chegada prevista às 19:00.' },
  { title: 'Estamos chegando!!', body: 'Faltam 3 minutos para a portaria.' },
  { title: 'Chegamos ao destino!', body: 'Bom estudo!' },
];

const PHONE_W = 214;
const PHONE_H = 400;
const FRAME = '#3a3a3a';

// Tremidinha rápida do celular, como se tivesse vibrado.
const makeBuzz = (buzz: Animated.Value) =>
  Animated.sequence(
    [-2.5, 2.5, -1.5, 1.5, 0].map((to) =>
      Animated.timing(buzz, { toValue: to, duration: 45, useNativeDriver: true })
    )
  );

export default function VanPhoneCard() {
  const anims = useRef(NOTIFICATIONS.map(() => new Animated.Value(0))).current;
  const buzz = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => setReduced(false));
  }, []);

  useEffect(() => {
    if (reduced === null) return;

    // Quem desativou animações vê todas as notificações paradas.
    if (reduced) {
      anims.forEach((a) => a.setValue(1));
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        ...anims.map((a) =>
          Animated.sequence([
            Animated.parallel([
              Animated.spring(a, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
              makeBuzz(buzz),
            ]),
            Animated.delay(1500),
          ])
        ),
        Animated.delay(1800),
        Animated.parallel(
          anims.map((a) => Animated.timing(a, { toValue: 0, duration: 450, useNativeDriver: true }))
        ),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);

  return (
    <View
      accessible
      accessibilityLabel="Exemplo de notificações do Vancontrol avisando que a van está chegando"
      style={{
        height: 440,
        borderRadius: 23,
        backgroundColor: '#131313',
        borderWidth: 1,
        borderColor: '#646363',
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 25, zIndex: 2 }}>
        <Label>PRÉVIA / EXEMPLO</Label>
      </View>

      {/* Celular: sai de baixo do card, cortado, pra sobrar espaço pras notificações */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -50,
          left: '50%',
          marginLeft: -PHONE_W / 2,
          width: PHONE_W,
          height: PHONE_H,
          transform: [{ translateX: buzz }],
        }}
      >
        {/* botões laterais */}
        <View style={{ position: 'absolute', right: -9, top: 70, width: 4, height: 28, borderRadius: 2, backgroundColor: FRAME }} />
        <View style={{ position: 'absolute', right: -9, top: 118, width: 4, height: 44, borderRadius: 2, backgroundColor: FRAME }} />

        <View
          style={{
            flex: 1,
            borderRadius: 34,
            borderWidth: 5,
            borderColor: FRAME,
            backgroundColor: '#0b0b0b',
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          {/* notch */}
          <View style={{ width: 78, height: 16, backgroundColor: FRAME, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }} />

          {/* tela de bloqueio */}
          <Text style={{ color: C.white, fontSize: 40, fontWeight: '800', letterSpacing: 1, marginTop: 5 }}>18:57</Text>
          <Text style={{ color: C.muted, fontWeight: '700', fontSize: 11, marginBottom: 14 }}>sexta-feira</Text>

          <View style={{ alignSelf: 'stretch', paddingHorizontal: 10 }}>
            {NOTIFICATIONS.map((n, i) => {
              const v = anims[i];
              return (
                <Animated.View
                  key={n.title}
                  style={{
                    opacity: v.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], extrapolate: 'clamp' }),
                    transform: [
                      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
                      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                    ],
                    flexDirection: 'row',
                    gap: 8,
                    padding: 9,
                    borderRadius: 14,
                    marginBottom: 8,
                    backgroundColor: 'rgba(218, 210, 210, 0.94)',
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      backgroundColor: C.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: C.white, fontSize: 11, fontWeight: '900' }}>V.</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 9, color: '#666', fontWeight: '700' }}>Vancontrol</Text>
                      <Text style={{ fontSize: 9, color: '#888' }}>agora</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#111', marginTop: 1 }}>{n.title}</Text>
                    <Text style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{n.body}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
