from pathlib import Path
import re, colorsys
root=Path(__file__).resolve().parent.parent
skip={'app/index.tsx','app/login.tsx','components/DashboardAdmin.tsx','components/DashboardMotorista.tsx','components/DashboardPassageiro.tsx','app/(main)/viagens.tsx','app/(main)/pagamentos.tsx'}
for f in list((root/'app').rglob('*.tsx'))+list((root/'components').rglob('*.tsx'))+[root/'constants/theme.ts']:
 rel=f.relative_to(root).as_posix()
 if rel in skip or rel.startswith('components/atelier/') or rel=='app/(main)/_layout.tsx': continue
 s=f.read_text(encoding='utf-8-sig')
 def replhex(m):
  h=m.group(0);v=h[1:];
  if len(v)==3: v=''.join(c*2 for c in v)
  if len(v)!=6:return h
  r,g,b=[int(v[i:i+2],16) for i in (0,2,4)]
  mx=max(r,g,b);mn=min(r,g,b)
  if mx-mn<17:return h
  # Dark backdrops -> charcoal, muted copy -> lighter cool gray
  if mx < 65:return '#111111'
  if mx < 115:return '#444444'
  if mx < 180:return '#989898'
  if mx < 232:return '#C4C4C4'
  return '#EEEEEE'
 s=re.sub(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b', replhex,s)
 def rgb_repl(m):
  r,g,b=map(int,m.group(1,2,3));a=m.group(4)
  if max(r,g,b)-min(r,g,b) < 18:return m.group(0)
  gray=round((r+g+b)/3)
  return f'rgba({gray},{gray},{gray},{a})'
 s=re.sub(r'rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([.\d]+)\s*\)',rgb_repl,s)
 # bring all legacy surfaces into the new design language
 s=s.replace("'#060c22'","'#080808'").replace("'#050a1e'","'#080808'")
 s=s.replace("'#070e28'","'#111111'").replace("'#100d28'","'#171717'").replace("'#0d1a40'","'#171717'")
 # hide circles that were used as generic decorative glows
 s=re.sub(r'((?:glowCircle|heroGlow|glowTopRight|glowBottomLeft|glowAccent|logoGlow):\s*\{)',r'\1 opacity: 0, ',s)
 # web/desktop width and whitespace discipline
 s=re.sub(r'(\b(?:scroll|body|content):\s*\{)',r"\1 maxWidth: 1190, width: '100%', alignSelf: 'center', ",s)
 f.write_text(s)
 print('Migrated',rel)
