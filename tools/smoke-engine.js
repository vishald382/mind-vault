const fs=require('fs'),vm=require('vm');
const store={};
const ctx={console,Math,Date,JSON,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},setTimeout};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['data-assets','data-content','data-india','data-wisdom',...require('fs').readdirSync('js').filter(x=>x.startsWith('pack-')).map(x=>x.slice(0,-3)),'engine','coach'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),ctx,{filename:f});
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
