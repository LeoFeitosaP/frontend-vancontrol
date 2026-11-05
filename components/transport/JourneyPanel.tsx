import { Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransport } from '../../hooks/useTransport';
import { isFreshLocation, occupancyRatio } from '../../services/transport';
import { GlassCard, MotionButton, palette, Radar } from './primitives';

export function JourneyPanel({ userId, trip, destination }: { userId: string; trip: string | null; destination?: string }) {
  const data = useTransport(userId, trip);
  const { snapshot } = data;
  const live = !data.error && isFreshLocation(snapshot?.localizacao ?? null, data.now);
  const ratio = occupancyRatio(snapshot?.ocupacao ?? null);
  const occupied = snapshot?.ocupacao;
  const stops = Array.isArray(snapshot?.paradas) ? snapshot.paradas : [];
  const unavailable = !trip || data.loading || data.saving;
  return <>
    <GlassCard>
      <View style={s.row}><View style={s.flex}><Text style={s.eyebrow}>SUA PRESENÇA</Text><Text style={s.title}>A gente se vê hoje?</Text></View><Ionicons name="hand-left-outline" size={26} color={palette.muted} /></View>
      <Text style={s.body}>{trip ? 'Um toque para organizar sua ida à universidade.' : 'Selecione uma viagem de hoje para informar sua presença.'}</Text>
      <View style={s.row}>
        {(['VOU', 'NAO_VOU'] as const).map(value => {
          const selected = data.attendance === value;
          const label = value === 'VOU' ? 'Eu vou hoje' : 'Não vou hoje';
          return <MotionButton key={value} label={label} selected={selected} disabled={unavailable} onPress={() => void data.choose(value)} style={s.flex}>
            <Ionicons name={value === 'VOU' ? 'checkmark-circle-outline' : 'close-circle-outline'} size={20} color={selected ? '#09090b' : '#fafafa'} />
            <Text style={[s.buttonText, selected && { color: '#09090b' }]}>{label}</Text>
          </MotionButton>;
        })}
      </View>
      <View accessibilityLiveRegion="polite" style={s.notice}>
        <Ionicons name={data.remote ? 'shield-checkmark-outline' : 'phone-portrait-outline'} size={16} color={palette.muted} />
        <Text style={[s.small, s.flex]}>{data.saveError ?? (data.saving ? 'Salvando sua escolha…' : data.loading ? 'Consultando presença…' : !data.remote ? (data.attendance ? 'Preferência salva neste dispositivo. Não enviada ao motorista.' : 'Sua escolha ficará neste dispositivo. Ainda não será enviada ao motorista.') : data.attendance ? 'Presença sincronizada com o transporte.' : 'Sua resposta será enviada ao transporte.')}</Text>
      </View>
    </GlassCard>
    <GlassCard>
      <View style={s.row}><View style={s.flex}><Text style={s.eyebrow}>ACOMPANHAMENTO</Text><Text style={s.title}>Sua van, mais perto.</Text></View><Radar active={live} /></View>
      <View style={s.location}><View style={s.mapIcon}><Ionicons name="navigate-outline" size={26} color="#fafafa" /></View>
        <View style={s.flex}><Text style={s.label}>{live ? 'Localização atualizada' : snapshot?.localizacao ? 'Última localização conhecida' : 'Aguardando localização'}</Text>
          <Text style={s.small}>{live ? 'Sinal recebido há menos de 90 segundos' : 'O acompanhamento aparece quando o transporte envia o sinal.'}</Text></View></View>
      {snapshot?.localizacao && <Text style={s.small}>Último sinal: {new Date(snapshot.localizacao.atualizadoEm).toLocaleString('pt-BR')}</Text>}
      {live && snapshot?.localizacao && <MotionButton label="Abrir localização no mapa" onPress={() => {
        const location = snapshot.localizacao!;
        void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`).catch(() => {});
      }}><Text style={s.buttonText}>Ver localização no mapa</Text><Ionicons name="arrow-up-right-box-outline" size={18} color="#fafafa" /></MotionButton>}
      <View style={s.divider} />
      <View style={s.row}><Text style={[s.label, s.flex]}>Ocupação da van</Text><Text style={s.count}>{ratio !== null && occupied ? `${occupied.embarcados} / ${occupied.capacidade}` : '— / —'}</Text></View>
      <View accessibilityRole="progressbar" accessibilityLabel="Ocupação da van" accessibilityValue={ratio === null ? { text: 'Ocupação não informada' } : { min: 0, max: 100, now: Math.round(ratio * 100) }} style={s.track}><View style={[s.fill, { width: `${(ratio ?? 0) * 100}%` }]} /></View>
      <Text style={s.small}>{ratio !== null && occupied ? `${Math.max(0, occupied.capacidade - occupied.embarcados)} vagas livres · ${occupied.embarcados >= occupied.capacidade ? 'Lotação atingida' : 'Pessoas embarcadas'}` : 'Contagem ainda não informada pelo transporte.'}</Text>
      <Text style={s.small}>{data.error ? data.error : data.syncedAt ? `Consultado às ${new Date(data.syncedAt).toLocaleTimeString('pt-BR')} · atualização a cada 15 s` : 'Aguardando dados do transporte.'}</Text>
      {data.error && <MotionButton label="Tentar atualizar acompanhamento" onPress={data.refresh}><Text style={s.buttonText}>Tentar novamente</Text></MotionButton>}
    </GlassCard>
    <GlassCard>
      <View style={s.row}><View style={s.flex}><Text style={s.eyebrow}>SEU TRAJETO</Text><Text style={s.title}>{destination || 'Até a universidade'}</Text></View><Ionicons name="git-commit-outline" size={26} color={palette.muted} /></View>
      <Text style={s.body}>{stops.length ? 'Acompanhe as paradas informadas pelo transporte.' : 'Os pontos e o progresso serão exibidos quando o transporte disponibilizar o trajeto.'}</Text>
      {(stops.length ? stops : [{ id: 'waiting', nome: 'Paradas não informadas', estado: 'PENDENTE' as const }]).map((stop, index, all) => <View key={stop.id} style={s.stop}>
        <View style={s.rail}><View style={[s.stopDot, stop.estado === 'PROXIMA' && s.nextDot]}><Ionicons name={stop.estado === 'CONCLUIDA' ? 'checkmark' : stop.estado === 'PROXIMA' ? 'bus-outline' : 'ellipse-outline'} size={16} color={stop.estado === 'PROXIMA' ? '#09090b' : '#a1a1aa'} /></View>{index < all.length - 1 && <View style={s.line} />}</View>
        <View style={[s.flex, { paddingBottom: index < all.length - 1 ? 24 : 0, paddingTop: 4 }]}><Text style={s.label}>{stop.nome}</Text><Text style={s.small}>{stop.estado === 'CONCLUIDA' ? 'Ponto percorrido' : stop.estado === 'PROXIMA' ? 'Próxima parada' : 'Aguardando'}{stop.horario ? ` · ${stop.horario}` : ''}</Text></View>
      </View>)}
    </GlassCard>
  </>;
}
const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { color: '#a1a1aa', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  title: { color: '#fafafa', fontSize: 23, fontWeight: '600', letterSpacing: -.7 },
  body: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  small: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  label: { color: '#e4e4e7', fontSize: 14, fontWeight: '600', lineHeight: 22 },
  buttonText: { color: '#fafafa', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  location: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  mapIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#232327', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: palette.border }, count: { color: '#fafafa', fontSize: 22, fontWeight: '600' },
  track: { height: 6, backgroundColor: '#303034', borderRadius: 3, overflow: 'hidden' }, fill: { height: 6, backgroundColor: '#e4e4e7', borderRadius: 3 },
  stop: { flexDirection: 'row', gap: 16, marginTop: -8 }, rail: { alignItems: 'center', width: 32 },
  stopDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#3f3f46', alignItems: 'center', justifyContent: 'center' },
  nextDot: { backgroundColor: '#fafafa', borderColor: '#fafafa' }, line: { width: 1, backgroundColor: '#3f3f46', flex: 1, minHeight: 22, marginVertical: 4 },
});
