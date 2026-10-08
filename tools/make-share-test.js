// Makes _test.html that builds share images (photo, emoji, fit-to-frame, story, model) and the write-up text.
// Open it with headless Edge from http://localhost:8765/_test.html (run tools/serve.js) so photos load like on the live site.
const fs=require('fs');
const t=`<pre id="T"></pre><script>(async function(){var out=[],NL=String.fromCharCode(10);window.onerror=function(m){out.push("ONERROR "+m)};MV.Topics.setProfile("Test");
var withPhoto=Object.keys(MV.MEDIA).filter(function(k){return MV.MEDIA[k][1]&&!MV.MEDIA[k][3]&&MV.E.asset(k)})[0],fit=Object.keys(MV.MEDIA).filter(function(k){return MV.MEDIA[k][3]&&MV.E.asset(k)})[0],noPhoto=MV.ASSETS.filter(function(a){return !(MV.MEDIA[a.id]||[])[1]})[0].id;
var cases=[["photo",{asset:withPhoto}],["fit",{asset:fit}],["emoji",{asset:noPhoto}],["story",{story:MV.STORIES[0].id}],["model",{model:MV.MODELS[0].id}],["long",{asset:MV.ASSETS.slice().sort(function(a,b){return (b.title+b.fact).length-(a.title+a.fact).length})[0].id}]];
for(var i=0;i<cases.length;i++){var c=cases[i];try{var r=await MV.Share.image(c[1]),w=MV.Share.what(c[1]),txt=MV.Share.writeUp(w);
out.push((r.blob.size>20000&&r.blob.type==="image/jpeg"&&txt.indexOf(MV.Share.SITE)>=0?"OK ":"FAIL ")+c[0]+" "+w.key+" photo="+r.photo+" jpg="+Math.round(r.blob.size/1024)+"KB text="+txt.length+" | "+txt.split(NL).join(" / "))}catch(e){out.push("FAIL "+c[0]+" "+e.stack)}}
var cv=MV.Share.draw(MV.Share.what({asset:withPhoto}),null);out.push("SHOT "+cv.toDataURL("image/jpeg",.7).length);window.SHOT=cv;
document.getElementById("T").textContent="RESULTS"+NL+out.join(NL)+NL+"END"})()</script></body>`;
fs.writeFileSync('_test.html',fs.readFileSync('index.html','utf8').replace('</body>',()=>t));
