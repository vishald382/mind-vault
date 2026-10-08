const fs=require('fs');
const idx=fs.readFileSync('index.html','utf8');
const t=`<pre id="T"></pre><script>(function(){var out=[],NL=String.fromCharCode(10);window.onerror=function(m){out.push("ONERROR "+m)};
var sc=document.querySelector(".feed-scroll"),i=0,types={};
function tick(){try{var cards=sc.children,c=cards[i];if(!c||i>=45){fin();return}
var eb=c.querySelector(".eyebrow");var ty=eb?eb.textContent.split(" ·")[0]:"idea";types[ty]=(types[ty]||0)+1;
c.scrollIntoView();sc.dispatchEvent(new Event("scroll"));var b=i===0?null:c.querySelector(".btn:not(.share-btn)");if(b&&b.tagName==="BUTTON"&&!/Practise/.test(b.textContent))b.click();var o=c.querySelector(".opt");if(o)o.click();var g=c.querySelectorAll(".btn.primary");if(g.length&&/Got it/.test(g[g.length-1].textContent))g[g.length-1].click();
i++;setTimeout(tick,1400)}catch(e){out.push("FAIL "+e.stack);fin()}}
function fin(){var c=MV.E.counts(),f=MV.Topics.filter(),ids=[].slice.call(sc.querySelectorAll(".fcard[data-id]")),on=ids.filter(function(x){return !f||f(MV.E.asset(x.dataset.id))}).length,su=ids.filter(function(x){return x.dataset.sur}).length;
out.push("ideas "+ids.length+" on-topic "+on+" surprises "+su+" chips "+document.querySelectorAll(".topic-bar .chip").length+" setup "+(document.querySelector(".ttile")?"SHOWN":"no"));out.push("cards "+sc.children.length+" visited "+i+" types "+JSON.stringify(types)+" assets "+c.assets+" conns "+c.conns+" h "+sc.clientHeight+" cardh "+sc.children[0].offsetHeight);document.getElementById("T").textContent="RESULTS"+NL+out.join(NL)+NL+"END"}
setTimeout(tick,300)})()</script></body>`;
const T=process.env.TOPICS||"";
const pre='<script>MV.Topics.setProfile("Test");'+JSON.stringify(T?T.split(","):[])+'.forEach(function(k){if(k.indexOf("q:")===0)MV.Topics.addInterest(k.slice(2));else MV.Topics.toggle(k)});</script><script src="js/app.js">';
fs.writeFileSync('_test.html',idx.replace('<script src="js/app.js">',()=>process.env.NOSETUP?'<script src="js/app.js">':pre).replace('</body>',()=>t));
fs.writeFileSync('_shot.html',idx.replace('<script src="js/app.js">','<script>MV.E.seedDemo();MV.Topics.needsSetup()&&MV.Topics.setProfile("")</script><script src="js/app.js">'));
