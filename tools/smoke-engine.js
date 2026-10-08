const fs=require('fs'),vm=require('vm');
const store={};
const ctx={console,Math,Date,JSON,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},setTimeout};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['data-assets','data-content','data-india','data-wisdom',...require('fs').readdirSync('js').filter(x=>x.startsWith('pack-')).map(x=>x.slice(0,-3)),'engine','topics','coach'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),ctx,{filename:f});
const MV=ctx.MV,E=MV.E;
// integrity
const ids=new Set(MV.ASSETS.map(a=>a.id)),mids=new Set(MV.MODELS.map(m=>m.id));
MV.LINKS.forEach(l=>{if(!ids.has(l[0])||!ids.has(l[1]))console.log('BAD LINK',l[0],l[1])});
MV.ASSETS.forEach(a=>{a.models.forEach(m=>mids.has(m)||console.log('BAD MODEL',a.id,m));(a.requires||[]).forEach(r=>ids.has(r)||console.log('BAD REQ',a.id,r));if(a.story&&!MV.STORIES.find(s=>s.id===a.story&&s.assetId===a.id))console.log('BAD STORY',a.id)});
console.log('assets',MV.ASSETS.length,'links',MV.LINKS.length);
// fresh
for(const intent of ['balanced','surprise','storytelling','general','dinner','challenge','forgetting','gap'])for(const m of [5,10,30]){const p=E.buildSession({minutes:m,intent});if(!p.steps.length)console.log('EMPTY fresh',intent,m)}
console.log('fresh 5:',E.buildSession({minutes:5}).steps.map(s=>s.kind+':'+s.id).join(' '));
E.seedDemo();
const c=E.counts();console.log('counts',JSON.stringify(c));
const m=E.metricsAt();console.log('metrics',Object.entries(m).filter(x=>x[0]!=='c').map(([k,v])=>k+'='+Math.round(v)).join(' '));
console.log('rescue',E.rescueList().slice(0,5).map(r=>r.id+':'+r.risk.toFixed(2)).join(' '));
console.log('gaps',E.gaps().map(g=>g.id+'('+g.down.length+'/'+g.linked.length+')').join(' '));
console.log('rec',JSON.stringify(E.recommend(4)));
for(const intent of ['balanced','surprise','storytelling','general','dinner','challenge','forgetting','gap'])for(const mm of [5,10,30]){const p=E.buildSession({minutes:mm,intent});console.log(intent,mm,'est',p.est,p.steps.map(s=>s.kind).join(','))}
console.log('path',E.pathBetween('roman-roads','m:network-effects').map(E.nodeLabel).join(' > '));
console.log('path2',E.pathBetween('thermopylae','buffett-compounding').map(E.nodeLabel).join(' > '));
console.log(E.identity().map(x=>x.text).join('\n'));
console.log('series',E.series(26).filter((_, i)=>i%5==0).map(p=>[p.assets,p.conns,p.models,p.used].join('/')).join(' '));
const st=MV.STORIES[1];
const bad="So um basically there was this submarine in the cold war and like it was near Cuba and the Soviet navy had sent it. And yeah they didn't fire. That's it.";
const good=[st.hook,st.setting,st.character,st.conflict,st.surprise,st.turning,st.payoff,st.meaning].join(' ');
let r=MV.Coach.analyzeStory(bad,st,{target:'90s'});console.log('bad',r.overall,JSON.stringify(r.scores),'\n ',r.coaching);
r=MV.Coach.analyzeStory(good,st,{target:'90s'});console.log('good',r.overall,JSON.stringify(r.scores),'\n ',r.coaching);
const a=E.asset('hanoi-rats');
r=MV.Coach.analyzeExplain("They paid a bounty for rat tails because they wanted fewer rats. But the tail was only a proxy for the goal, so people cut tails off and released the rats to breed, which means the city ended up with more rats: the opposite effect.",a,'30s');console.log('ex good',r.overall,r.pass,JSON.stringify(r.scores),r.coaching);
r=MV.Coach.analyzeExplain("It was about rats in a city and it went badly.",a,'30s');console.log('ex bad',r.overall,r.pass,r.coaching);
r=MV.Coach.analyzeConvo("That reminds me of something. In 1902 Hanoi paid a bounty for rat tails, and people started breeding rats to collect it. Does your team have a metric like that?",a);console.log('convo',r.overall,r.pass,JSON.stringify(r.scores));

// topics: tiles, typed interests, requests, the 85/15 mix, sync of requests
{const T=MV.Topics;E.reset();
const empty=T.TILES.filter(t=>!T.count(t[0]));console.log(empty.length?'FAIL empty tiles '+empty.map(t=>t[0]):'OK tiles '+T.TILES.length);
T.toggle('nature');const f=T.filter();const recs=E.recommend(50,{filter:f,noSurprise:true});console.log(recs.length&&recs.every(r=>f(E.asset(r.id)))?'OK nature-only recs '+recs.length:'FAIL nature recs');
const other=E.recommend(20,{filter:a=>!f(a),noSurprise:true});console.log(other.every(r=>!f(E.asset(r.id)))?'OK other recs '+other.length:'FAIL other recs');
let sur=0;for(let i=0;i<1000;i++)if(T.isSurpriseSlot(i))sur++;console.log(sur===150?'OK surprise share 15%':'FAIL surprise '+sur);
const b=T.addInterest('birds'),y=T.addInterest('yoga'),z=T.addInterest('zzqx'),n=T.addInterest('history');
console.log(b.n>=8&&!b.request&&T.interests().includes('birds')?'OK birds '+b.n:'FAIL birds '+JSON.stringify(b));
console.log(y.request&&T.interests().includes('yoga')&&z.request&&!T.interests().includes('zzqx')?'OK requests '+T.requests().map(r=>r.q+':'+r.n).join(','):'FAIL requests');
console.log(n.tile==='history'&&T.topics().includes('history')?'OK typed tile':'FAIL typed tile '+JSON.stringify(n));
const g=T.filter('q:birds');console.log(MV.ASSETS.filter(g).length===b.n?'OK chip filter':'FAIL chip filter');
T.removeRequest('yoga');const R=JSON.parse(E.syncPayload());R.requests=R.requests.map(r=>r.q==='yoga'?Object.assign({},r,{off:undefined}):r).concat([{t:Date.now(),q:'Cricket',n:8}]);E.mergeState(R);
console.log(T.requests().map(r=>r.q).sort().join(',')==='Cricket,zzqx'?'OK request sync':'FAIL request sync '+T.requests().map(r=>r.q));
T.setProfile('Asha');E.seedDemo();console.log(T.profile().name==='Asha'&&T.topics().includes('nature')&&T.requests().length===2?'OK demo keeps profile and requests':'FAIL demo profile');
console.log(T.requestsText().split(String.fromCharCode(10))[0]);E.reset();console.log(T.needsSetup()?'OK reset asks setup again':'FAIL reset');}
