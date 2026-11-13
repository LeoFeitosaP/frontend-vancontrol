import React from 'react';
import { Tabs,router } from 'expo-router';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { C,Brand,Label } from '../../components/atelier/ui';
import { useAuth } from '../../hooks/useAuth';

const PRIMARY = [
 {name:'index',label:'Visão geral',mobile:'Início',icon:'grid-outline'},
 {name:'rotas',label:'Rotas',mobile:'Rotas',icon:'map-outline'},
 {name:'veiculos',label:'Veículos',mobile:'Frota',icon:'bus-outline'},
 {name:'perfil',label:'Minha conta',mobile:'Perfil',icon:'person-outline'},
] as const;
function NavItem({title,icon,active,onPress,compact=false}:{title:string,icon:any,active:boolean,onPress:()=>void,compact?:boolean}){
 return <Pressable onPress={onPress} style={({pressed})=>({flexDirection:compact?'column':'row',alignItems:'center',justifyContent:compact?'center':'flex-start',gap:compact?5:14,paddingHorizontal:compact?6:15,paddingVertical:compact?12:15,borderRadius:12,backgroundColor:active?'#292929':'transparent',borderWidth:active?1:0,borderColor:'#454545',opacity:pressed?.7:1,flex:compact?1:undefined})}><Ionicons name={icon} size={compact?21:18} color={active?C.white:C.muted}/><Text style={{color:active?C.white:C.muted,fontSize:compact?10:13,fontWeight:active?'800':'600'}}>{title}</Text>{!compact&&active&&<View style={{marginLeft:'auto',height:5,width:5,backgroundColor:C.white,borderRadius:4}}/>}</Pressable>
}
function AtelierTabBar({state,navigation}:BottomTabBarProps){const {width}=useWindowDimensions(),desktop=width>=950,insets=useSafeAreaInsets();const {user}=useAuth();
 const to=(name:string)=>{const route=state.routes.find(r=>r.name===name);if(route){const event=navigation.emit({type:'tabPress',target:route.key,canPreventDefault:true});if(!event.defaultPrevented)navigation.navigate(name)}};
 const isActive=(name:string)=>state.routes[state.index]?.name===name;
 if(!desktop)return <View style={{backgroundColor:'#111',borderTopWidth:1,borderTopColor:'#303030',paddingTop:7,paddingBottom:Math.max(7,insets.bottom),paddingHorizontal:8,flexDirection:'row',justifyContent:'space-around'}}>{PRIMARY.map(item=><NavItem key={item.name} compact active={isActive(item.name)} icon={item.icon} title={item.mobile} onPress={()=>to(item.name)}/>)}</View>;
 return <View style={{width:240,backgroundColor:'#0E0E0E',borderRightWidth:1,borderRightColor:'#292929',paddingTop:36,paddingHorizontal:16,paddingBottom:24,justifyContent:'space-between'}}><View><View style={{paddingHorizontal:10,paddingBottom:50}}><Brand/></View><View style={{paddingHorizontal:13,marginBottom:11}}><Label>WORKSPACE</Label></View><View style={{gap:5}}>{PRIMARY.map(item=><NavItem key={item.name} title={item.label} active={isActive(item.name)} icon={item.icon} onPress={()=>to(item.name)}/>)}</View><View style={{height:1,backgroundColor:'#292929',marginVertical:30}}/><View style={{paddingHorizontal:13,marginBottom:12}}><Label>OPERAÇÕES</Label></View><View style={{gap:5}}><NavItem title="Viagens" icon="navigate-outline" active={isActive('viagens')} onPress={()=>to('viagens')}/><NavItem title="Financeiro" icon="card-outline" active={isActive('pagamentos')} onPress={()=>to('pagamentos')}/>{user?.role==='ADMIN'&&<NavItem title="Motoristas" icon="people-outline" active={isActive('motoristaAdmin')} onPress={()=>to('motoristaAdmin')}/>}</View></View><View style={{borderTopWidth:1,borderColor:'#292929',paddingTop:20,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:11}}><View style={{height:36,width:36,borderRadius:11,backgroundColor:'#313131',borderWidth:1,borderColor:'#555',alignItems:'center',justifyContent:'center'}}><Text style={{color:C.white,fontWeight:'800'}}>{(user?.name||'V').charAt(0).toUpperCase()}</Text></View><View style={{flex:1}}><Text numberOfLines={1} style={{fontSize:12,color:C.white,fontWeight:'800'}}>{user?.name||'VanControl'}</Text><Text style={{fontSize:10,color:C.muted,marginTop:4}}>{user?.role||'CONTA'}</Text></View></View></View>
}
export default function MainLayout(){const {width}=useWindowDimensions();return <Tabs tabBar={(props)=><AtelierTabBar {...props}/>} screenOptions={{headerShown:false,tabBarPosition:width>=950?'left':'bottom',sceneStyle:{backgroundColor:C.bg}}}>
 <Tabs.Screen name="index" options={{title:'Visão geral'}}/>
 <Tabs.Screen name="rotas" options={{title:'Rotas'}}/>
 <Tabs.Screen name="veiculos" options={{title:'Veículos'}}/>
 <Tabs.Screen name="perfil" options={{title:'Perfil'}}/>
 <Tabs.Screen name="viagens" options={{title:'Viagens',href:null}}/>
 <Tabs.Screen name="pagamentos" options={{title:'Pagamentos',href:null}}/>
 <Tabs.Screen name="motoristaAdmin" options={{title:'Motoristas Admin',href:null}}/>
 <Tabs.Screen name="motoristaMotorista" options={{title:'Meus Dados',href:null}}/>
 <Tabs.Screen name="motoristaPassageiro" options={{title:'Motoristas',href:null}}/>
 </Tabs>}
