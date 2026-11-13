import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';

import {
    Animated,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

import {
    Brand,
    Button,
    C,
    Label,
    Panel
} from '../components/atelier/ui';

import VanPhoneCard from '../components/atelier/VanPhoneCard';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const wide = width > 850;

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, []);

  const features = [
    {
      num: '01',
      title: 'Presença sem atrito',
      text: 'Confirme seus planos em segundos.',
      icon: 'checkmark-done-outline',
    },
    {
      num: '02',
      title: 'Uma rota mais clara',
      text: 'Informações organizadas de ponta a ponta.',
      icon: 'navigate-outline',
    },
    {
      num: '03',
      title: 'Gestão inteligente',
      text: 'Estudantes, motoristas e administradores.',
      icon: 'grid-outline',
    },
  ];

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: C.bg,
      }}
      contentContainerStyle={{
        minHeight: '100%',
        paddingHorizontal: wide ? 45 : 22,
        paddingVertical: wide ? 36 : 25,
        alignItems: 'center',
      }}
    >
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={{
          width: '100%',
          maxWidth: 1260,
          opacity: fade,
        }}
      >
        {/* =====================================
            NAVBAR
        ===================================== */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 28,
            borderBottomWidth: 1,
            borderColor: C.line,
          }}
        >
          <Brand />

          <Pressable
            onPress={() => router.push('/login')}
            style={{
              paddingVertical: 11,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#444',
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: C.white,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              Acessar minha conta ↗
            </Text>
          </Pressable>
        </View>

        {/* =====================================
            HERO SECTION
        ===================================== */}

        <View
          style={{
            flexDirection: wide ? 'row' : 'column',
            gap: wide ? 70 : 40,
            alignItems: 'center',
            paddingTop: wide ? 99 : 65,
            paddingBottom: wide ? 100 : 66,
          }}
        >
          {/* CONTEÚDO PRINCIPAL */}

          <View
            style={{
              flex: 1,
              width: '100%',
              gap: 25,
            }}
          >
            <Text
              style={{
                fontSize: wide ? 75 : 49,
                lineHeight: wide ? 80 : 55,
                color: C.white,
                fontWeight: '900',
                letterSpacing: wide ? -4 : -2.5,
              }}
            >
              O caminho{'\n'}
              mais simples{'\n'}
              até lá.
            </Text>

            <Text
              style={{
                fontSize: wide ? 18 : 15,
                color: '#999',
                lineHeight: wide ? 29 : 25,
                maxWidth: 480,
              }}
            >
              Sua rotina universitária merece mais clareza.
              Presença, viagens, rotas e comunicação em uma
              experiência feita para você.
            </Text>

            {/* BOTÕES */}

            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 17,
              }}
            >
              <Button
                title="Criar minha conta"
                onPress={() => router.push('/register')}
              />

              <Button
                title="Já tenho conta"
                subtle
                icon="log-in-outline"
                onPress={() => router.push('/login')}
              />
            </View>
          </View>

          {/* VISUAL DO CELULAR */}

          <View
            style={{
              flex: 1,
              width: '100%',
              maxWidth: 520,
            }}
          >
            <VanPhoneCard />
          </View>
        </View>

        {/* =====================================
            BENEFÍCIOS DO SISTEMA
        ===================================== */}

        <View
          style={{
            borderTopWidth: 1,
            borderColor: C.line,
            paddingTop: 15,
            gap: 22,
          }}
        >


          <View
            style={{
              flexDirection: wide ? 'row' : 'column',
              gap: 14,
            }}
          >
            {features.map((feature) => (
              <Panel
                key={feature.num}
                style={{
                  flex: 1,
                  minHeight: 163,
                  justifyContent: 'space-between',
                }}
              >
                {/* CABEÇALHO DO CARD */}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Label>
                    {feature.num} / BENEFÍCIO
                  </Label>

                  <Ionicons
                    name={feature.icon as any}
                    size={19}
                    color={C.soft}
                  />
                </View>

                {/* CONTEÚDO DO CARD */}

                <View
                  style={{
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 19,
                      fontWeight: '800',
                      color: C.white,
                    }}
                  >
                    {feature.title}
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: C.muted,
                    }}
                  >
                    {feature.text}
                  </Text>
                </View>
              </Panel>
            ))}
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
