const fs=require('fs');
const t=`<pre id="T"></pre><script>(function(){var out=[],NL=String.fromCharCode(10);window.onerror=function(m){out.push("ONERROR "+m)};MV.E.seedDemo();var V=MV.Views,root=document.getElementById("view");
var rs=[["today"],["portfolio"],["graph"],["library"],["asset","hanoi-rats"],["asset","sarajevo-1914"],["asset","v-laconic"],["models"],["stories"],["conversation"],["gaps"],["missions"],["ask"],["settings"]];
rs.forEach(function(r){root.innerHTML="";try{V[r[0]](root,r[1]);out.push("OK "+r.join("/")+" "+root.textContent.length)}catch(e){out.push("FAIL "+r.join("/")+" "+e.stack)}});
["learn","recognize","recall","rescue","explain","explain10","connect","story","convo","apply","challenge"].forEach(function(k){try{MV.Session.startSteps([{kind:k,id:k==="story"?"hanoi-rats":"cold-war-mad",model:"game-theory",level:"2min"}]);root.innerHTML="";MV.Session.render(root);out.push("OK step "+k+" "+root.textContent.length)}catch(e){out.push("FAIL step "+k+" "+e.stack)}});
root.innerHTML="";V.ask(root);root.querySelectorAll(".row.mb .chip").forEach(function(c){try{c.click();out.push("OK ask "+c.textContent.slice(0,30)+" "+root.querySelector(".card.mt").textContent.length)}catch(e){out.push("FAIL ask "+e.stack)}});
if(!window.KEEP){MV.E.reset();root.innerHTML="";try{V.today(root);V.portfolio(root);V.gaps(root);V.ask(root);out.push("OK fresh")}catch(e){out.push("FAIL fresh "+e.stack)}}
document.getElementById("T").textContent="RESULTS"+NL+out.join(NL)+NL+"END"})()</script></body>`;
fs.writeFileSync('_test.html',fs.readFileSync('index.html','utf8').replace('</body>',()=>t));
