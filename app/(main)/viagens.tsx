import React,{useCallback,useEffect,useState} from 'react';
import {View,Text,Pressable,ActivityIndicator,TextInput} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {viagensService} from '../../services/api';
import {useAuth} from '../../hooks/useAuth';
import {C,Shell,Panel,Pill,SectionTitle} from '../../components/atelier/ui';
export default function ViagensScreen(){
 const {user}=useAuth();
 const [items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [codigoRota,setCodigoRota]=useState(''),[placaVeiculo,setPlacaVeiculo]=useState(''),[cpfMotorista,setCpfMotorista]=useState('');
 const [dataViagem,setDataViagem]=useState(''),[horarioSaidaPrevisto,setHorarioSaidaPrevisto]=useState(''),[horarioChegadaPrevisto,setHorarioChegadaPrevisto]=useState('');
 const [creating,setCreating]=useState(false),[message,setMessage]=useState('');
 const canCreate=user?.role==='ADMIN'||user?.role==='MOTORISTA';
 const load=useCallback(async()=>{setLoading(true);setError('');try{const v=await viagensService.listar();setItems(Array.isArray(v)?v:[])}catch(e:any){setError(e?.message||'Não foi possível obter viagens.')}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);
 const create=async()=>{
  const fields=[codigoRota,placaVeiculo,cpfMotorista,dataViagem,horarioSaidaPrevisto,horarioChegadaPrevisto].map(value=>value.trim());
  if(fields.some(value=>!value)){setError('Preencha todos os campos para cadastrar a viagem.');setMessage('');return}
  setCreating(true);setError('');setMessage('');
  try{
   await viagensService.criar({codigoRota:fields[0],placaVeiculo:fields[1],cpfMotorista:fields[2],dataViagem:fields[3],horarioSaidaPrevisto:fields[4],horarioChegadaPrevisto:fields[5]});
   setMessage('Viagem cadastrada com sucesso.');
   setCodigoRota('');setPlacaVeiculo('');setCpfMotorista('');setDataViagem('');setHorarioSaidaPrevisto('');setHorarioChegadaPrevisto('');
   await load();
  }catch(e:any){setError(e?.message||'Não foi possível cadastrar a viagem.')}finally{setCreating(false)}
 };
 return <Shell eyebrow="OPERAÇÕES / VIAGENS" title="Cada viagem, organizada." description="Consulte viagens registradas na plataforma e acompanhe o histórico disponível.">
  {canCreate&&<><SectionTitle title="Cadastrar viagem" caption="Nova saída operacional"/><Panel padding={16} style={{gap:12,marginBottom:18}}>
   <TextInput value={codigoRota} onChangeText={setCodigoRota} placeholder="Código da rota (ROT-...)" placeholderTextColor={C.faint} style={inputStyle}/>
   <TextInput value={placaVeiculo} onChangeText={setPlacaVeiculo} placeholder="Placa do veículo" placeholderTextColor={C.faint} autoCapitalize="characters" style={inputStyle}/>
   <TextInput value={cpfMotorista} onChangeText={setCpfMotorista} placeholder="CPF do motorista" placeholderTextColor={C.faint} keyboardType="numeric" style={inputStyle}/>
   <View style={{flexDirection:'row',gap:10}}><TextInput value={dataViagem} onChangeText={setDataViagem} placeholder="Data (AAAA-MM-DD)" placeholderTextColor={C.faint} style={[inputStyle,{flex:1}]}/><TextInput value={horarioSaidaPrevisto} onChangeText={setHorarioSaidaPrevisto} placeholder="Saída (HH:mm)" placeholderTextColor={C.faint} style={[inputStyle,{flex:1}]}/></View>
   <TextInput value={horarioChegadaPrevisto} onChangeText={setHorarioChegadaPrevisto} placeholder="Chegada (HH:mm)" placeholderTextColor={C.faint} style={inputStyle}/>
   <Pressable disabled={creating} onPress={create} style={{height:48,borderRadius:12,backgroundColor:C.white,alignItems:'center',justifyContent:'center',opacity:creating?.6:1}}><Text style={{color:C.bg,fontWeight:'800'}}>{creating?'Cadastrando...':'Cadastrar viagem'}</Text></Pressable>
  </Panel></>}
  {!!message&&<Text style={{color:C.white,paddingBottom:15}}>{message}</Text>}
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:15}}><Pill text={`${items.length} REGISTROS`}/><Pressable onPress={load} style={{flexDirection:'row',gap:8,padding:10}}><Ionicons name="refresh-outline" size={17} color={C.white}/><Text style={{color:C.white,fontSize:12,fontWeight:'700'}}>Atualizar</Text></Pressable></View>
  <Panel>{loading?<ActivityIndicator color={C.white} size="large" style={{marginVertical:35}}/>:error?<Text style={{color:C.muted,lineHeight:23,paddingVertical:15}}>{error}</Text>:items.length?items.map((v,i)=><View key={String(v.codigoViagem||v.codigo||i)} style={{flexDirection:'row',gap:16,alignItems:'center',paddingVertical:20,borderBottomWidth:i<items.length-1?1:0,borderColor:C.line}}><View style={{backgroundColor:'#272727',width:45,height:45,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Ionicons name="navigate-outline" color={C.white} size={20}/></View><View style={{flex:1,gap:6}}><Text style={{color:C.white,fontSize:14,fontWeight:'800'}}>Viagem {v.codigoViagem||v.codigo||String(i+1).padStart(3,'0')}</Text><Text style={{color:C.muted,fontSize:12}}>{v.dataViagem||v.data||'Data não informada'}</Text></View><Pill text={String(v.viagemConcuida?'CONCLUÍDA':v.status||'CADASTRADA')}/></View>):<View style={{alignItems:'center',paddingVertical:40,gap:13}}><Ionicons name="calendar-outline" size={31} color={C.muted}/><Text style={{color:C.white,fontWeight:'800'}}>Nenhuma viagem encontrada.</Text><Text style={{color:C.muted,fontSize:12}}>Os registros aparecerão aqui quando forem cadastrados.</Text></View>}</Panel>
 </Shell>
}

const inputStyle={height:46,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:'#1B1B1B',color:C.white,paddingHorizontal:14};
