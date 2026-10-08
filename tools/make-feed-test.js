const fs=require('fs');
const idx=fs.readFileSync('index.html','utf8');
const t=`<pre id="T"></pre><script>(function(){var out=[],NL=String.fromCharCode(10);window.onerror=function(m){out.push("ONERROR "+m)};
var sc=document.querySelector(".feed-scroll"),i=0,types={};
function tick(){try{var cards=sc.children,c=cards[i];if(!c||i>=45){fin();return}
var eb=c.querySelector(".eyebrow");var ty=eb?eb.textContent.split(" ·")[0]:"idea";types[ty]=(types[ty]||0)+1;
c.scrollIntoView();sc.dispatchEvent(new Event("scroll"));var b=i===0?null:c.querySelector(".btn");if(b&&b.tagName==="BUTTON"&&!/Practise/.test(b.textContent))b.click();var o=c.querySelector(".opt");if(o)o.click();var g=c.querySelectorAll(".btn.primary");if(g.length&&/Got it/.test(g[g.length-1].textContent))g[g.length-1].click();
i++;setTimeout(tick,1400)}catch(e){out.push("FAIL "+e.stack);fin()}}
function fin(){var c=MV.E.counts();out.push("cards "+sc.children.length+" visited "+i+" types "+JSON.stringify(types)+" assets "+c.assets+" conns "+c.conns+" h "+sc.clientHeight+" cardh "+sc.children[0].offsetHeight);document.getElementById("T").textContent="RESULTS"+NL+out.join(NL)+NL+"END"}
setTimeout(tick,300)})()</script></body>`;
fs.writeFileSync('_test.html',idx.replace('</body>',()=>t));
fs.writeFileSync('_shot.html',idx.replace('<script src="js/app.js">','<script>MV.E.seedDemo()</script><script src="js/app.js">'));
