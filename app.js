
"use strict";
const loginForm=document.getElementById('login-form');
const loginError=document.getElementById('login-error');
const loginButton=document.getElementById('login-button');
function fromBase64(value){
 return Uint8Array.from(atob(value),c=>c.charCodeAt(0));
}
loginForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(loginButton.disabled) return;
 loginButton.disabled=true;
 loginButton.textContent='Entrando…';
 loginError.textContent='';
 const password=document.getElementById('password');
 const username=document.getElementById('username').value.trim().toLowerCase();
 try{
  if(!globalThis.crypto?.subtle) throw new Error('CRYPTO_UNAVAILABLE');
  const vault=window.CONSORCIOS_VAULT;
  const encoded=new TextEncoder().encode(username+'\0'+password.value);
  const material=await crypto.subtle.importKey('raw',encoded,'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:fromBase64(vault.salt),iterations:vault.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(vault.iv)},key,fromBase64(vault.payload));
  const records=JSON.parse(new TextDecoder().decode(plain));
  startDashboard(records);
  password.value='';
  document.getElementById('login-screen').hidden=true;
  document.getElementById('dashboard').hidden=false;
  document.getElementById('page-title').focus();
 }catch(error){
  loginError.textContent=error.message==='CRYPTO_UNAVAILABLE'?'Abra este painel por HTTPS ou em um navegador atualizado.':'Usuário ou senha inválidos.';
  password.value='';
  password.focus();
 }finally{
  loginButton.disabled=false;
  loginButton.textContent='Entrar';
 }
});
document.getElementById('toggle-password').addEventListener('click',()=>{
 const field=document.getElementById('password'), button=document.getElementById('toggle-password');
 const showing=field.type==='password';
 field.type=showing?'text':'password';
 button.textContent=showing?'Ocultar':'Mostrar';
 button.setAttribute('aria-pressed',String(showing));
});
document.getElementById('logout').addEventListener('click',()=>location.reload());

function startDashboard(data){
"use strict";

const el = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const integer = new Intl.NumberFormat('pt-BR');
const brl = cents => cents == null ? '—' : fmt.format(cents / 100);
const n = x => integer.format(x);
const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = v => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const compact = v => normalize(v).replace(/[^a-z0-9]/g,'');
const sum = (list, fn) => list.reduce((total,item) => total + (fn(item) || 0),0);
const settled = c => c.status === 'QUITADA';
const won = c => !!c.when && !c.disqualified;
const statusText = c => settled(c) ? 'Quitada' : won(c) ? 'Contemplada' : 'Aguardando';
const pill = c => '<span class="pill '+(settled(c)?'done':won(c)?'':'wait')+'">'+statusText(c)+'</span>';
const card = (label,value,note) => '<article class="card"><b>'+label+'</b><strong>'+value+'</strong><span class="mini">'+note+'</span></article>';
const stat = (label,value,note) => '<div class="stat"><strong>'+value+'</strong>'+label+' <small>'+note+'</small></div>';
const day = d => (d||'').split('/').reverse().join('');
const groups = [...new Set(data.map(c=>c.group))];
el('group').insertAdjacentHTML('beforeend',groups.map(g=>'<option>'+g+'</option>').join(''));
const compare = {
  natural: (a,b)=>a.group.localeCompare(b.group)||a.quota.localeCompare(b.quota),
  balance: (a,b)=>b.balance-a.balance,
  open: (a,b)=>b.open.length-a.open.length,
  few: (a,b)=>a.open.length-b.open.length,
  recent: (a,b)=>day(b.when).localeCompare(day(a.when))
};

const tractorBase='<path d="M10 17h16l2 4h6l2-6-2-3h-9m-6 5-2-5H8m6 5h13m6-5V9m0 0h2M7 12h3"/><circle cx="11" cy="22" r="6"/><circle cx="31" cy="24" r="4"/><path d="M11 22h.01m20 2h.01"/>';
const paths={
 'tractor-open':tractorBase+'<path d="M13 12V8h3m4 3h5m-2 0v5M8 5h11m-9 0v6"/>',
 'tractor-cab':tractorBase+'<path d="M9 12V5h11l5 7m-10-7v7h10"/>',
 index:'<path d="M11 4h13l6 6v15H11zM24 4v7h6M15 20l4-4 3 2 4-4m-4 0h4v4"/>'
};
function kind(c){
 const a=normalize(c.asset);
 return a.includes('ipca')?'index':a.includes('com cabine')||a.includes('c/cab')?'tractor-cab':'tractor-open';
}
const kindName={'tractor-open':'Trator sem cabine','tractor-cab':'Trator com cabine',index:'Crédito com referência IPCA'};
function icon(type){
 return '<span class="asset-icon" title="'+kindName[type]+'"><svg viewBox="0 0 40 30" role="img" aria-label="'+kindName[type]+'" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+paths[type]+'</svg></span>';
}
const pct = (a,b) => b ? a/b*100 : 0;
const percent = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
const ratio = (left,right) => percent.format(pct(left,left+right))+'%';
function ring(left,paid){
 return '<svg class="ring" aria-hidden="true" viewBox="0 0 48 48"><circle class="base" cx="24" cy="24" r="17"/><circle class="remaining" cx="24" cy="24" r="17" pathLength="100" transform="rotate(-90 24 24)" stroke-dasharray="'+pct(left,left+paid)+' 100" opacity="'+(left>0?1:0)+'"/></svg>';
}
let metric='money';
let expanded=new Set();
const formatGroup = (key,rs) => {
 const labels=[...new Set(rs.map(c=>c.asset))];
 const rates=[...new Set(rs.map(c=>c.adminRate))].sort((a,b)=>a-b).map(v=>percent.format(v)+'%').join(' / ');
 const types=[...new Set(rs.map(kind))];
 const count=rs.filter(won).length;
 const left=metric==='money'?sum(rs,c=>c.balance):sum(rs,c=>c.open.length);
 const paid=metric==='money'?sum(rs,c=>c.paid):sum(rs,c=>+c.paidCount);
 const label=metric==='money'?brl(left):n(left)+' parcelas';
 const share=ratio(left,paid);
 return '<button class="group-card" data-group="'+key+'" aria-pressed="'+(el('group').value===key)+'" title="'+safe(labels.join(' · '))+'">'+
 '<div class="group-title"><strong>Grupo '+key+'</strong><small>'+count+' de '+rs.length+' contempladas</small></div>'+
 '<div class="asset-row">'+types.map(icon).join('')+'<span>'+safe(types.map(t=>kindName[t]).join(' · '))+'</span></div>'+
 '<div class="group-money">'+label+'</div><div class="track" aria-hidden="true"><div class="fill" style="width:'+pct(paid,left+paid)+'%"></div><div class="rest" style="width:'+pct(left,left+paid)+'%"></div></div>'+
 '<div class="group-caption"><span>Falta pagar</span><span>'+share+' do total</span></div><div class="group-caption"><span>Taxa adm. '+rates+'</span><span>'+brl(sum(rs,c=>c.adminTotal))+'</span></div></button>';
};
function redraw(){
 const query=normalize(el('query').value.trim());
 const group=el('group').value, state=el('state').value;
 const matches=data.filter(c=>
   (!state||(state==='won'&&won(c))||(state==='waiting'&&!won(c))||(state==='settled'&&settled(c))) &&
   (!query||query.split(/\s+/).every(word=>normalize(c.group+' '+c.quota+' '+c.asset+' '+c.document+' '+c.financeDescription).includes(word)|| (compact(word)&&compact(c.group+c.quota).includes(compact(word)))))
 );
 const rows=matches.filter(c=>!group||group===c.group).sort((a,b)=>compare[el('order').value](a,b)||compare.natural(a,b));
 const selected=rows.filter(won);
 const planCount=sum(rows,c=>c.open.length);
 const pending=rows.flatMap(c=>c.pending);
 el('cost-summary').innerHTML=costCards(rows)+costTable(rows);
 const paid=sum(rows,c=>c.paid), balance=sum(rows,c=>c.balance), planTotal=sum(rows,c=>c.openSum);
 el('overall').innerHTML=ring(balance,paid)+'<div><strong>'+ratio(balance,paid)+'</strong><span>Falta pagar</span></div>';
 el('cards').innerHTML=
  card('Saldo a pagar',brl(balance),n(planCount)+' parcelas restantes')+
  card('Pago no extrato',brl(paid),n(sum(rows,c=>+c.paidCount))+' parcelas pagas no resumo')+
  card('Contempladas',n(selected.length)+' de '+n(rows.length),n(rows.length-selected.length)+' aguardando · '+n(rows.filter(settled).length)+(rows.filter(settled).length===1?' quitada':' quitadas'));
 el('comparison').hidden=balance===planTotal;
 el('comparison').textContent='Soma das parcelas do plano '+brl(planTotal)+' · saldo da administradora '+brl(balance)+' · diferença '+brl(balance-planTotal)+'.';
 el('paid-label').textContent=metric==='money'?'Pago no extrato':'Parcelas pagas';
 el('chart').innerHTML=groups.map(g=>[g,matches.filter(c=>c.group===g)]).filter(([,rs])=>rs.length).map(([g,rs])=>formatGroup(g,rs)).join('')||'<p class="sub">Nenhum consórcio encontrado.</p>';
 el('results').innerHTML=
  stat('Crédito total das cotas',brl(sum(rows,c=>c.credit)),'')+
  stat('Crédito corrigido das contempladas',brl(sum(selected,c=>c.corrected)),n(selected.filter(c=>c.method.startsWith('Lance')).length)+' por lance · '+n(selected.filter(c=>c.method==='Sorteio').length)+' por sorteio')+
  stat('Valor no campo “Bem Entregue”',brl(sum(selected,c=>c.delivered)),n(selected.filter(c=>c.delivery).length)+' datas de entrega no extrato')+
  stat('Valor no campo “Líquido à Pagar”',brl(sum(selected,c=>c.net)),'')+
  stat('Lances embutidos lançados',brl(sum(rows.flatMap(c=>c.lances),r=>r[2])),'')+
  stat('Com vencimento em 17/11/2026',brl(sum(pending,p=>p[2])),n(pending.length)+' parcelas');
 el('rows').innerHTML=groups.map(g=>{
  const rs=rows.filter(c=>c.group===g);
  if(!rs.length) return '';
  const open=!!group||!!query||expanded.has(g);
  const heading='<summary><b>Grupo '+g+'</b><small>'+n(rs.length)+' cotas · '+n(rs.filter(won).length)+' contempladas</small><strong>'+brl(sum(rs,c=>c.balance))+' a pagar</strong></summary>';
  const body=rs.map(c=>'<tr><td class="nowrap"><button class="open" data-id="'+data.indexOf(c)+'">'+c.quota+'</button><br><small>DOC '+safe(c.document||'—')+'</small></td><td><div class="asset-row">'+icon(kind(c))+'<span>'+safe(c.financeDescription||c.asset)+'</span></div></td><td>'+pill(c)+(c.when?'<br><small>'+c.when+'</small>':'')+'</td><td class="num">'+brl(c.credit)+'</td><td class="num">'+brl(c.paid)+'</td><td class="num">'+n(c.open.length)+'</td><td>'+(c.next?c.next[1]+'<br><small>'+brl(c.next[2])+'</small>':'—')+'</td><td class="num"><b>'+brl(c.balance)+'</b></td></tr>').join('');
  const head='<thead><tr><th>Cota</th><th>Bem de referência</th><th>Situação</th><th class="num">Crédito</th><th class="num">Pago</th><th class="num">Parcelas restantes</th><th>Vencimento no extrato</th><th class="num">Saldo a pagar</th></tr></thead>';
  return '<details class="group-block" data-block="'+g+'"'+(open?' open':'')+'>'+heading+'<div class="view"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>';
 }).join('')||'<p class="empty">Nenhuma cota encontrada.</p>';
 el('count').textContent=n(rows.length)+' de '+n(data.length)+' cotas';
}
function table(head,rows){
 return '<div class="view"><table><thead><tr>'+head.map(x=>'<th>'+safe(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+safe(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function section(title,content,open=false){
 return '<details'+(open?' open':'')+'><summary>'+safe(title)+'</summary><div>'+content+'</div></details>';
}
const occurrences={P:'Paga',A:'Antecipada',I:'Rateio',L:'Lance','-':'Em aberto','.':'Prorrogada'};
const colors={P:'p',A:'a',I:'i',L:'l','-':'open','.':'ext'};

function costCards(rows){
 const admin=sum(rows,c=>c.adminTotal), reserve=sum(rows,c=>c.reserveTotal);
 const rate=[...new Set(rows.map(c=>c.adminRate))].sort((a,b)=>a-b).map(v=>percent.format(v)+'%').join(' / ');
 return '<div class="cards cost-cards">'+
 card('Taxa de administração',brl(admin),rate?'Taxa contratada '+rate:'Sem cotas selecionadas')+
 card('Administração a pagar',brl(sum(rows,c=>c.costs['Taxa de Administração'][1])),'Incluída no saldo devedor')+
 card('Fundo de reserva',brl(reserve),'Pago + a pagar')+
 card('Total do plano',brl(sum(rows,c=>c.totalCommitment)),'Pago + saldo do extrato')+'</div>';
}
function costTable(rows){
 const components=['Fundo comum','Taxa de Administração','Fundo de Reserva','Adesão','Seguros','Multas','Juros'];
 const lines=components.map(label=>{
  const paid=sum(rows,c=>c.costs[label][0]), due=sum(rows,c=>c.costs[label][1]);
  return [label,brl(paid),brl(due),brl(paid+due)];
 });
 const otherDue=sum(rows,c=>c.costs.Outros[1]);
 const difference=sum(rows,c=>c.parcelDifference);
 if(otherDue) lines.push(['Outros valores a pagar','—',brl(otherDue),brl(otherDue)]);
 if(difference) lines.push(['Diferença de parcela','—',brl(difference),brl(difference)]);
 lines.push(['Total do quadro financeiro',brl(sum(rows,c=>c.paid)),brl(sum(rows,c=>c.balance)),brl(sum(rows,c=>c.totalCommitment))]);
 const charges=sum(rows,c=>c.charges), otherPaid=sum(rows,c=>c.costs.Outros[0]);
 return table(['Composição','Pago','A pagar','Total'],lines)+
 '<p class="note">Custos além do fundo comum <b>'+brl(charges)+'</b> no quadro financeiro.</p>'+
 (otherPaid?'<p class="note">Outros valores na conta corrente <b>'+brl(otherPaid)+'</b>. Apresentados separadamente no extrato.</p>':'')+
 '<p class="note">Valores na posição de 12/11/2026, sujeitos aos reajustes do plano.</p>';
}

function detail(c){
 el('detail-source').textContent='Extrato de 12/11/2026 · páginas '+c.pages[0]+' a '+c.pages.at(-1)+' · cobrança '+c.status.toLowerCase();
 el('detail-title').textContent='Grupo '+c.group+' · cota '+c.quota;
 const pc = Number(c.ideal.replace(',','.'));
 const notice = Object.fromEntries(c.pending.map(p=>[p[0],p[1]]));
 const openRows = c.open.map(r=>[r[0],brl(r[1]),notice[r[0]]||'—',c.hist[Number(r[0])-1]==='.'?'Prorrogada · '+(r[2]||'ver plano'):r[2]||'Em aberto']);
 const diff=c.balance-c.openSum;
 const plan = '<p>O plano lista <b>'+n(c.open.length)+' parcelas com valor a pagar</b>. Soma dessas parcelas <b>'+brl(c.openSum)+'</b>.</p>'+
 (diff?'<p class="callout">Diferença entre o saldo a pagar do quadro financeiro e a soma das parcelas <b>'+brl(diff)+'</b>. Consulte o subtotal, as negociações e os percentuais do Plano de Cobrança em “Dados e quadros do extrato”.</p>':'')+
 (openRows.length?table(['Parcela','Valor do plano','Vencimento emitido','Ocorrência'],openRows):'<p>O plano não indica parcelas com valor positivo.</p>');
 const result = c.when ? '<p>'+pill(c)+' <b>'+c.when+'</b> · '+safe(c.method)+'</p><div class="cards">'+card('Crédito corrigido',brl(c.corrected),'Na contemplação')+card('Bem entregue',brl(c.delivered),c.delivery?'Data no extrato '+c.delivery:'Data de entrega em branco')+card('Líquido a pagar',brl(c.net),'Campo da contemplação')+'</div>' : '<p>Aguardando contemplação. O extrato não registra data nem modalidade.</p>';
 const hist = '<div class="hist" aria-hidden="true">'+Array.from(c.hist,(x,i)=>'<span class="slot '+colors[x]+'" title="'+(i+1)+' · '+occurrences[x]+'"></span>').join('')+'</div>'+
 '<p class="mini">'+Object.entries(occurrences).filter(([k])=>c.hist.includes(k)).map(([k,v])=>v+' '+[...c.hist].filter(x=>x===k).length).join(' · ')+'</p>';
 const raw = Object.entries(c.blocks).map(([name,lines])=>section(name,'<pre>'+safe(lines.map(l=>l.replace(/^ {0,3}/,'')).join('\n'))+'</pre>')).join('');
 el('detail-body').innerHTML='<div class="detail-asset">'+icon(kind(c))+'<div><h3>'+safe(c.asset)+'</h3><small>Plano de '+Number(c.term)+' meses</small></div></div>'+
 '<div class="detail-meter">'+ring(c.balance,c.paid)+'<div><strong>'+ratio(c.balance,c.paid)+' do total ainda a pagar</strong><small>'+n(c.open.length)+' parcelas · '+brl(c.balance)+' de saldo</small></div></div>'+
 '<div class="cards">'+card('Crédito',brl(c.credit),'Valor de referência')+card('Pago no extrato',brl(c.paid),Number(c.paidCount)+' parcelas no resumo de pagas')+card('Saldo a pagar',brl(c.balance),'Quadro financeiro')+card('Contribuição mensal',brl(c.monthly),c.next?'Aviso de '+brl(c.next[2])+' em '+c.next[1]:'Sem aviso de vencimento')+'</div>'+
 '<p class="mini">Fundo comum pago · <b>'+safe(c.ideal)+'%</b></p><progress class="progress" max="100" value="'+Math.min(100,pc)+'" aria-label="Percentual do fundo comum pago"></progress>'+hist+
 section('Custos e taxa de administração',costCards([c])+costTable([c]),true)+
 section('Dados do Financeiro','<p><b>Documento '+safe(c.document||'ausente')+'</b></p><p>'+safe(c.financeDescription)+'</p><p>Plano de '+Number(c.term)+' meses · '+c.paidCount+' pagas · '+c.open.length+' a pagar · '+c.adjustmentCount+' em rateio e ajustes</p><p>Lance registrado '+brl(c.lanceValue)+' · equivalência '+(c.lanceEquivalent??'não informada')+' parcelas</p>',true)+
 section('Parcelas a pagar · '+n(c.open.length),plan,true)+
 section('Contemplação',result,true)+
 section('Histórico de lançamentos · '+n(c.ledger.length),'<p>O valor lançado pode incluir lances embutidos, outros créditos e encargos. Total pago na conta corrente <b>'+brl(c.ledgerTotal)+'</b>.</p>'+table(['Parcela','Histórico','Vencimento','Pagamento','Valor devido','Valor pago','Multa','Juros','Seguro','% pago','% diferença'],c.ledger.map(r=>[r[0]||'—',r[1],r[2],r[3],r[6],r[7],r[8],r[9],r[10],r[11],r[12]])))+
 (c.lances.length?section('Lances embutidos',table(['Pagamento','Histórico','Valor lançado'],c.lances.map(r=>[r[0],r[1],brl(r[2])]))):'')+
 section('Reajustes de preço · '+n(c.prices.length),table(['Reajuste','Efetivação','Preço','Variação %'],c.prices))+
 section('Dados e quadros do extrato',raw);
 el('detail-body').scrollTop=0;
 el('detail').showModal();
 el('detail').scrollTop=0;
}
for(const id of ['group','state','order']) el(id).addEventListener('change',redraw);
el('query').addEventListener('input',redraw);
el('clear').addEventListener('click',()=>{for(const id of ['query','group','state']) el(id).value='';el('order').value='natural';redraw();});
el('chart').addEventListener('click',e=>{
 const button=e.target.closest('[data-group]');
 if(!button) return;
 const g=button.dataset.group;
 el('group').value=el('group').value===g?'':g;
 redraw();
 if(el('group').value){
  const group=document.querySelector('[data-block="'+g+'"] summary');
  group.focus({preventScroll:true});
  el('portfolio').scrollIntoView({block:'start'});
 } else {
  document.querySelector('[data-group="'+g+'"]').focus();
 }
});
el('rows').addEventListener('click',e=>{
 const block=e.target.closest('summary')?.parentElement;
 if(!block?.dataset.block) return;
 if(block.open) expanded.delete(block.dataset.block);
 else expanded.add(block.dataset.block);
});
for(const id of ['money','units']) el(id).addEventListener('click',()=>{
 metric=id;
 for(const key of ['money','units']) el(key).setAttribute('aria-pressed',String(key===id));
 redraw();
});
el('rows').addEventListener('click',e=>{if(e.target.dataset.id!==undefined) detail(data[Number(e.target.dataset.id)]);});
el('close').addEventListener('click',()=>el('detail').close());
let openedForPrint=[];
window.addEventListener('beforeprint',()=>{
 if(el('detail').open) return;
 openedForPrint=[...document.querySelectorAll('.group-block:not([open])')];
 openedForPrint.forEach(block=>block.open=true);
});
window.addEventListener('afterprint',()=>{
 openedForPrint.forEach(block=>block.open=false);
 openedForPrint=[];
});
for(const id of ['print','print-detail']) el(id).addEventListener('click',()=>window.print());
redraw();

}
