import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { passageirosService, pagamentosService, viagensService } from '../services/api';
import type { AuthUser } from '../hooks/useAuth';
import { localDay } from '../services/transport';
import { GlassCard, MotionButton, palette, Reveal } from './transport/primitives';
import { JourneyPanel } from './transport/JourneyPanel';

type Trip = { codigo: string; dataViagem?: string; status?: string; rota?: { destino?: string }; destino?: string };
type Payment = { id?: string; competencia?: string; status?: string; valor?: number };
type Passenger = { instituicaoEnsino?: string; intituicaoEnsino?: string; turno?: string };

export default function DashboardPassageiro({ user }: { user: AuthUser }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 950;
  const [passageiro, setPassageiro] = useState<Passenger | null>(null);
  const [pagamentos, setPagamentos] = useState<Payment[]>([]);
  const [viagens, setViagens] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [today, setToday] = useState(localDay());
  useEffect(() => { const timer = setInterval(() => setToday(localDay()), 1000); return () => clearInterval(timer); }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      setRefreshing(true);
      const results = await Promise.allSettled([
        passageirosService.buscarPorCpf(user.cpf || user.sub), pagamentosService.meusPagamentos(), viagensService.listar(),
      ]);
      if (!active) return;
      const [p, pg, v] = results;
      const failures: string[] = [];
      if (p.status === 'fulfilled') setPassageiro(p.value); else failures.push('perfil');
      if (pg.status === 'fulfilled' && Array.isArray(pg.value)) setPagamentos(pg.value); else failures.push('pagamentos');
      if (v.status === 'fulfilled' && Array.isArray(v.value)) setViagens(v.value.filter(item => typeof item.codigo === 'string')); else failures.push('viagens');
      setErrors(failures); setLoading(false); setRefreshing(false);
    }
    void load(); return () => { active = false; };
  // These values deliberately reload on manual refresh and local date rollover.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.cpf, user.sub, reload, today]));
  const tripsToday = viagens.filter(v => v.dataViagem?.slice(0, 10) === today && !['CANCELADA', 'CONCLUIDA'].includes(v.status ?? ''));
  const trip = tripsToday.find(v => v.codigo === selected);
  const pending = pagamentos.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO').length;
  const actions = [
    { icon: 'map-outline', label: 'Rotas', path: '/(main)/rotas' },
    { icon: 'bus-outline', label: 'Veículos', path: '/(main)/veiculos' },
    { icon: 'people-outline', label: 'Motoristas', path: '/(main)/motoristaPassageiro' },
    { icon: 'person-outline', label: 'Meu perfil', path: '/(main)/perfil' },
  ] as const;
  return <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: Math.max(28, insets.top + 16), paddingHorizontal: width < 400 ? 16 : 32 }]}
    refreshControl={<RefreshControl refreshing={refreshing && !loading} onRefresh={() => setReload(n => n + 1)} tintColor="#fafafa" />}>
    <View style={styles.container}>
      <View style={styles.brandRow}><View style={styles.brand}><View style={styles.logo}><Ionicons name="bus" color="#09090b" size={20} /></View><Text style={styles.brandName}>vancontrol<Text style={{ color: '#71717a' }}> / estudante</Text></Text></View><View style={styles.secure}><Ionicons name="shield-checkmark-outline" size={14} color="#a1a1aa" /><Text style={styles.small}>Sua jornada conectada</Text></View></View>
      <View style={styles.hero}>
        <View style={styles.flex}><Text style={styles.eyebrow}>{new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text><Text style={[styles.heroName, { fontSize: wide ? 46 : 34 }]}>Seu dia começa{wide ? ' ' : '\n'}com tranquilidade.</Text><Text style={styles.heroSub}>Olá, {user.name?.split(' ')[0] || 'estudante'}. Seu transporte, em um só lugar.</Text></View>
        {wide && <View style={styles.avatar}><Text style={styles.avatarLetter}>{user.name?.[0]?.toUpperCase() || 'V'}</Text></View>}
      </View>
      {errors.length > 0 && <View accessibilityRole="alert" style={styles.error}><View style={styles.flex}><Text style={styles.label}>Algumas informações não carregaram</Text><Text style={styles.small}>{errors.join(', ')}. Verifique a conexão e tente novamente.</Text></View><MotionButton label="Recarregar painel" disabled={refreshing} onPress={() => setReload(n => n + 1)}><Ionicons name="refresh" color="#fafafa" size={20} /></MotionButton></View>}
      {loading ? <View style={{ gap: 16 }}><ActivityIndicator color="#fafafa" accessibilityLabel="Carregando seu painel" /><Text style={styles.small}>Preparando sua jornada…</Text>{[180, 240, 160].map((height, i) => <View key={i} style={{ height, backgroundColor: '#18181b', borderRadius: 24 }} />)}</View> : <Reveal>
        <View style={[styles.columns, { flexDirection: wide ? 'row' : 'column' }]}>
          <View style={[styles.main, { flex: wide ? 1.45 : undefined }]}>
            <GlassCard>
              <View style={styles.sectionRow}><View style={styles.flex}><Text style={styles.eyebrow}>VIAGEM DE HOJE</Text><Text style={styles.title}>Qual é a sua viagem?</Text></View><Ionicons name="calendar-outline" size={24} color="#a1a1aa" /></View>
              <Text style={styles.small}>Selecione a viagem combinada com seu motorista.</Text>
              {tripsToday.length ? <View style={styles.tripChoices}>{tripsToday.map(v => <MotionButton key={v.codigo} label={`Selecionar viagem ${v.codigo}`} selected={trip?.codigo === v.codigo} onPress={() => setSelected(v.codigo)}>
                <Text style={[styles.label, trip?.codigo === v.codigo && { color: '#09090b' }]}>{v.rota?.destino || v.destino || `Viagem ${v.codigo}`} · {v.codigo}</Text>
              </MotionButton>)}</View> : <Text style={styles.body}>{errors.includes('viagens') ? 'A lista de viagens está indisponível.' : 'Nenhuma viagem disponível para hoje.'}</Text>}
              {trip && <Text style={styles.small}>Status informado: {trip.status?.replace(/_/g, ' ').toLowerCase() || 'não informado'}</Text>}
            </GlassCard>
            <JourneyPanel key={`${user.cpf || user.sub}:${trip?.codigo ?? ''}:${today}`} userId={user.cpf || user.sub} trip={trip?.codigo ?? null} destination={trip?.rota?.destino || trip?.destino} />
          </View>
          <View style={[styles.aside, { flex: wide ? 1 : undefined }]}>
            <GlassCard><Text style={styles.eyebrow}>TUDO À MÃO</Text><View style={styles.actionsGrid}>{actions.map(action => <MotionButton key={action.label} label={action.label} onPress={() => router.push(action.path)} style={styles.actionTile}><Ionicons name={action.icon} size={19} color="#e4e4e7" /><Text style={styles.label}>{action.label}</Text></MotionButton>)}</View></GlassCard>
            <GlassCard><View style={styles.sectionRow}><Text style={[styles.title, styles.flex]}>Pagamentos</Text><Ionicons name="wallet-outline" size={22} color="#a1a1aa" /></View>
              <Text style={styles.body}>{errors.includes('pagamentos') ? 'Não foi possível atualizar seus pagamentos.' : pending ? `${pending} pagamento${pending > 1 ? 's' : ''} pendente${pending > 1 ? 's' : ''}` : pagamentos.length ? 'Tudo em dia. Boa viagem!' : 'Nenhum pagamento disponível.'}</Text>
              {pagamentos.slice(0, 3).map((pg, i) => <View key={pg.id || `${pg.competencia}-${i}`} style={styles.payRow}><View style={styles.flex}><Text style={styles.label}>{pg.competencia || 'Competência não informada'}</Text><Text style={styles.small}>{pg.status?.replace(/_/g, ' ') || 'Status não informado'}</Text></View><Text style={styles.label}>{pg.valor != null ? Number(pg.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</Text></View>)}
            </GlassCard>
            <GlassCard><Text style={styles.eyebrow}>SEU DESTINO</Text><Ionicons name="school-outline" size={28} color="#a1a1aa" /><Text style={styles.title}>{passageiro?.instituicaoEnsino || passageiro?.intituicaoEnsino || 'Sua universidade'}</Text><Text style={styles.body}>{passageiro?.turno ? `Turno ${passageiro.turno.toLowerCase()}` : 'Consulte seus dados no perfil.'}</Text><MotionButton label="Ver meu perfil" onPress={() => router.push('/(main)/perfil')}><Text style={styles.label}>Ver meu perfil</Text><Ionicons name="arrow-forward" color="#fafafa" size={18} /></MotionButton></GlassCard>
            <View style={styles.tip}><Ionicons name="information-circle-outline" color="#71717a" size={20} /><Text style={[styles.small, styles.flex]}>Chegue ao ponto com antecedência. Se seus planos mudarem, avise seu motorista.</Text></View>
          </View>
        </View>
        <Text style={styles.footer}>VANCONTROL  /  Mais simples, do ponto ao campus.</Text>
      </Reveal>}
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.bg }, content: { paddingBottom: 48 },
  container: { width: '100%', maxWidth: 1180, alignSelf: 'center', gap: 24 }, flex: { flex: 1, minWidth: 0 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: palette.border },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#fafafa', fontWeight: '600', fontSize: 15, letterSpacing: -.5 }, secure: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hero: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 20 }, eyebrow: { color: '#a1a1aa', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 },
  heroName: { color: '#fafafa', fontWeight: '600', letterSpacing: -1.5 }, heroSub: { color: '#a1a1aa', fontSize: 15, lineHeight: 24, marginTop: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#202024', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3f3f46' }, avatarLetter: { color: '#fafafa', fontSize: 24 },
  columns: { gap: 24, alignItems: 'stretch' }, main: { gap: 20, minWidth: 0 }, aside: { gap: 20, minWidth: 0 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { color: '#fafafa', fontSize: 22, fontWeight: '600', letterSpacing: -.5 },
  body: { color: '#a1a1aa', fontSize: 14, lineHeight: 22 }, small: { color: '#a1a1aa', fontSize: 12, lineHeight: 19 }, label: { color: '#e4e4e7', fontSize: 13, fontWeight: '600', lineHeight: 20, flexShrink: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, actionTile: { flexGrow: 1, flexBasis: '45%' }, tripChoices: { gap: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.border },
  error: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#52525b', backgroundColor: '#202024' },
  tip: { flexDirection: 'row', gap: 12, padding: 8 }, footer: { color: '#71717a', fontSize: 10, letterSpacing: 1, paddingTop: 8, textAlign: 'center' },
});
