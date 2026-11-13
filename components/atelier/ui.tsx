
import React, { useEffect, useRef } from 'react';

import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// =====================================
// PALETA DE CORES
// =====================================

export const C = {
  bg: '#080808',
  panel: '#111111',
  raised: '#181818',
  hover: '#222222',
  white: '#F5F5F4',
  soft: '#C5C5C3',
  muted: '#838381',
  faint: '#575755',
  line: '#292929',
  accent: '#FFFFFF',
};

// =====================================
// SOMBRAS
// =====================================

export const shadow = Platform.select({
  web: {
    boxShadow: '0 22px 55px rgba(0,0,0,.28)',
  } as any,

  default: {
    elevation: 4,
  },
});

// =====================================
// BRAND / LOGOTIPO
// =====================================

export function Brand({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
      }}
    >
      <View
        style={{
          width: small ? 28 : 34,
          height: small ? 28 : 34,
          borderWidth: 1,
          borderColor: '#080808',
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080808',
        }}
      >
      </View>

      <Text
        style={{
          fontWeight: '900',
          fontSize: small ? 19 : 23,
          color: C.white,
          letterSpacing: -0.8,
        }}
      >
        VanControl
        <Text style={{ color: '#f8f4f4' }}>.</Text>
      </Text>
    </View>
  );
}

// =====================================
// LABEL
// =====================================

export function Label({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text
      style={{
        fontSize: 11,
        letterSpacing: 2.1,
        fontWeight: '700',
        color: C.muted,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

// =====================================
// HEADING
// =====================================

export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View
      style={{
        gap: 11,
        marginBottom: 25,
      }}
    >
      {eyebrow && <Label>{eyebrow}</Label>}

      <Text
        style={{
          fontSize: 37,
          lineHeight: 43,
          letterSpacing: -1.7,
          fontWeight: '800',
          color: C.white,
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={{
            fontSize: 14,
            color: C.muted,
            lineHeight: 22,
          }}
        >
          {description}
        </Text>
      )}
    </View>
  );
}

// =====================================
// PANEL / CARD
// =====================================

export function Panel({
  children,
  style,
  padding = 23,
}: {
  children: React.ReactNode;
  style?: any;
  padding?: number;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.panel,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 19,
          padding,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// =====================================
// PILL / BADGE
// =====================================

export function Pill({
  text,
  active = false,
}: {
  text: string;
  active?: boolean;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 50,
        backgroundColor: active ? '#292929' : '#191919',
        borderColor: active ? '#626262' : C.line,
        borderWidth: 1,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
      }}
    >
      {active && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#F6F6F6',
          }}
        />
      )}

      <Text
        style={{
          color: active ? C.white : C.muted,
          fontWeight: '700',
          fontSize: 11,
          letterSpacing: 0.5,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// =====================================
// BUTTON
// =====================================

export function Button({
  title,
  onPress,
  subtle = false,
  icon = 'arrow-forward-outline',
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  subtle?: boolean;
  icon?: any;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: subtle ? '#202020' : C.white,
          borderWidth: 1,
          borderColor: subtle ? '#383838' : C.white,
          borderRadius: 12,
          paddingVertical: 15,
          paddingHorizontal: 19,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          opacity: pressed ? 0.75 : disabled ? 0.4 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontWeight: '800',
          fontSize: 13,
          color: subtle ? C.white : C.bg,
        }}
      >
        {title}
      </Text>

      <Ionicons
        name={icon}
        color={subtle ? C.white : C.bg}
        size={17}
      />
    </Pressable>
  );
}

// =====================================
// LINK ROW
// =====================================

export function LinkRow({
  icon,
  title,
  description,
  to,
  index,
}: {
  icon: any;
  title: string;
  description?: string;
  to: string;
  index?: string;
}) {
  return (
    <Pressable
      onPress={() => router.push(to as any)}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          borderBottomWidth: 1,
          borderColor: '#272727',
          paddingVertical: 17,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      {/* ÍCONE */}

      <View
        style={{
          height: 42,
          width: 42,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#3B3B3B',
          backgroundColor: '#1D1D1D',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons
          name={icon}
          color={C.white}
          size={19}
        />
      </View>

      {/* TEXTO */}

      <View
        style={{
          flex: 1,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: C.white,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>

        {description && (
          <Text
            style={{
              fontSize: 12,
              color: C.muted,
            }}
          >
            {description}
          </Text>
        )}
      </View>

      {/* ÍNDICE */}

      {index && (
        <Text
          style={{
            fontSize: 11,
            color: C.faint,
            marginRight: 8,
          }}
        >
          {index}
        </Text>
      )}

      {/* SETA */}

      <Ionicons
        name="arrow-up-outline"
        size={16}
        color={C.muted}
        style={{
          transform: [{ rotate: '45deg' }],
        }}
      />
    </Pressable>
  );
}

// =====================================
// METRIC / INDICADORES
// =====================================

export function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: any;
}) {
  return (
    <Panel
      style={{
        flex: 1,
        minWidth: 160,
        gap: 13,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Label>{label}</Label>

        {icon && (
          <Ionicons
            name={icon}
            color={C.muted}
            size={18}
          />
        )}
      </View>

      <Text
        style={{
          fontSize: 37,
          fontWeight: '800',
          color: C.white,
          letterSpacing: -1.8,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          fontSize: 12,
          color: C.muted,
        }}
      >
        {detail || 'Atualizado com os dados disponíveis'}
      </Text>
    </Panel>
  );
}

// =====================================
// SHELL / LAYOUT PRINCIPAL
// =====================================

export function Shell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const { width } = useWindowDimensions();
  const desktop = width > 800;

  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 550,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: C.bg,
      }}
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: desktop ? 36 : 17,
        paddingTop: desktop ? 51 : 30,
        paddingBottom: 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          width: '100%',
          maxWidth: 1190,
          opacity: appear,
          transform: [
            {
              translateY: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [13, 0],
              }),
            },
          ],
        }}
      >
        {/* CABEÇALHO */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: desktop ? 51 : 35,
          }}
        >
          <Brand small />

          <Pill text="PAINEL / 2026" />
        </View>

        {/* TÍTULO DA PÁGINA */}

        {title && (
          <Heading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        )}

        {/* CONTEÚDO */}

        {children}
      </Animated.View>
    </ScrollView>
  );
}

// =====================================
// SECTION TITLE
// =====================================

export function SectionTitle({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18,
        marginTop: 30,
        gap: 10,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.4,
          color: C.white,
        }}
      >
        {title}
      </Text>

      {caption && (
        <Text
          style={{
            fontSize: 12,
            color: C.muted,
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
}

// =====================================
// SEGMENTS / TIMELINE
// =====================================

export function Segments({
  steps,
  active = 0,
}: {
  steps: {
    title: string;
    sub?: string;
  }[];
  active?: number;
}) {
  return (
    <View
      style={{
        paddingVertical: 10,
      }}
    >
      {steps.map((step, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            minHeight: 75,
          }}
        >
          {/* INDICADOR */}

          <View
            style={{
              width: 35,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 19,
                height: 19,
                borderRadius: 10,
                backgroundColor:
                  i <= active ? C.white : C.panel,
                borderWidth: 2,
                borderColor:
                  i <= active ? C.white : '#555',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {i < active && (
                <Ionicons
                  name="checkmark"
                  size={12}
                  color="#000"
                />
              )}

              {i === active && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: C.bg,
                  }}
                />
              )}
            </View>

            {/* LINHA CONECTORA */}

            {i < steps.length - 1 && (
              <View
                style={{
                  flex: 1,
                  width: 1,
                  borderLeftWidth: 1,
                  borderColor:
                    i < active ? '#bbb' : '#555',
                  borderStyle:
                    i < active ? 'solid' : 'dashed',
                  marginVertical: 5,
                }}
              />
            )}
          </View>

          {/* CONTEÚDO */}

          <View
            style={{
              flex: 1,
              marginLeft: 13,
              gap: 5,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color:
                  i <= active ? C.white : C.muted,
                fontWeight: '700',
              }}
            >
              {step.title}
            </Text>

            {step.sub && (
              <Text
                style={{
                  color: C.muted,
                  fontSize: 12,
                }}
              >
                {step.sub}
              </Text>
            )}
          </View>

          {/* NUMERAÇÃO */}

          <Text
            style={{
              fontSize: 11,
              color: C.faint,
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </Text>
        </View>
      ))}
    </View>
  );
}

// =====================================
// MINI BARS / GRÁFICO
// =====================================

export function MiniBars({
  values = [
    33, 51, 42, 66, 57, 74,
    58, 82, 65, 90, 70, 78,
  ],
}: {
  values?: number[];
}) {
  return (
    <View
      style={{
        height: 105,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingTop: 10,
      }}
    >
      {values.map((value, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: `${Math.max(4, value)}%` as any,
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            backgroundColor:
              index === values.length - 1
                ? C.white
                : '#353535',
          }}
        />
      ))}
    </View>
  );
}

// =====================================
// DIVIDER
// =====================================

export function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: C.line,
        marginVertical: 18,
      }}
    />
  );
}

// =====================================
// INITIALS / AVATAR
// =====================================

export function Initials({
  name,
}: {
  name: string;
}) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#555',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#272727',
      }}
    >
      <Text
        style={{
          color: C.white,
          fontWeight: '800',
        }}
      >
        {(name || '?').slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}
