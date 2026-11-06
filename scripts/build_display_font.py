"""Turn the project's original isolated ink glyphs into a bundled display TTF.

This authors a font, rather than modifying the source illustration. It traces
36 original glyph silhouettes, adds punctuation/Italian diacritics as vector
outlines, and retains the original alphabet for reproducibility.
Requires fontTools, Pillow, NumPy and SciPy only at font-authoring time.
"""
from pathlib import Path
import argparse, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import label, find_objects
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

def simplify(points, epsilon=.65):
    a = np.asarray(points, dtype=float)
    if len(a) < 4:
        return points
    v = a[-1] - a[0]
    if np.linalg.norm(v) == 0:
        distances = np.linalg.norm(a-a[0], axis=1)
    else:
        distances = np.abs(v[0]*(a[:,1]-a[0,1])-v[1]*(a[:,0]-a[0,0])) / np.linalg.norm(v)
    i = int(np.argmax(distances))
    if distances[i] <= epsilon:
        return [points[0], points[-1]]
    return simplify(points[:i+1], epsilon)[:-1] + simplify(points[i:], epsilon)

def boundaries(mask):
    edges = {}
    def edge(a,b): edges.setdefault(a,[]).append(b)
    h,w=mask.shape
    for y,x in zip(*np.where(mask)):
        if y==0 or not mask[y-1,x]: edge((x,y),(x+1,y))
        if x==w-1 or not mask[y,x+1]: edge((x+1,y),(x+1,y+1))
        if y==h-1 or not mask[y+1,x]: edge((x+1,y+1),(x,y+1))
        if x==0 or not mask[y,x-1]: edge((x,y+1),(x,y))
    loops=[]
    while edges:
        start=next(iter(edges)); point=start; loop=[start]
        while True:
            following=edges[point].pop()
            if not edges[point]: del edges[point]
            loop.append(following); point=following
            if point==start: break
        if len(loop)>12: loops.append(simplify(loop)[:-1])
    return loops

def circle(x,y,r,n=16):
    return [(x+r*math.cos(i*2*math.pi/n),y+r*math.sin(i*2*math.pi/n)) for i in range(n)][::-1]

def stroke(points,width=42):
    out=[]
    for a,b in zip(points,points[1:]):
        dx,dy=b[0]-a[0],b[1]-a[1]; length=math.hypot(dx,dy)
        if not length: continue
        nx,ny=-dy/length*width/2,dx/length*width/2
        out.append([(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),(b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)])
    out.extend(circle(x,y,width/2,10) for x,y in points)
    return out

def make_glyph(contours):
    pen=TTGlyphPen(None)
    for points in contours:
        if len(points)<3: continue
        pen.moveTo(tuple(round(v) for v in points[0]))
        for point in points[1:]: pen.lineTo(tuple(round(v) for v in point))
        pen.closePath()
    return pen.glyph()

def build(source, output):
    image=Image.open(source).convert('L')
    labels,count=label(np.array(image)<145,structure=np.ones((3,3)))
    boxes=find_objects(labels)
    components=[]
    for i,box in enumerate(boxes,1):
        if box is None: continue
        ys,xs=box; area=int(np.count_nonzero(labels[box]==i))
        if area>180: components.append({'id':i,'box':box,'cx':(xs.start+xs.stop)/2,'cy':(ys.start+ys.stop)/2})
    if len(components)!=36: raise ValueError(f'Expected 36 isolated glyphs, got {len(components)}')
    components.sort(key=lambda c:c['cy'])
    ordered=[]
    for row in range(4): ordered.extend(sorted(components[row*9:(row+1)*9],key=lambda c:c['cx']))
    glyph_contours={}; widths={}; cmap={}; manifest=[]
    for ch,c in zip(ORDER,ordered):
        ys,xs=c['box']; mask=labels[c['box']]==c['id']; height,width=mask.shape; scale=700/height
        contours=[]
        for loop in boundaries(mask): contours.append([(40+x*scale,(height-y)*scale) for x,y in loop][::-1])
        name='ink'+str(ord(ch)); glyph_contours[name]=contours; widths[name]=round(width*scale+80); cmap[ord(ch)]=name
        manifest.append({'character':ch,'sourceBox':[xs.start,ys.start,xs.stop,ys.stop],'advance':widths[name]})
    # Small capitals preserve the same hand-drawn alphabet for user casing.
    for ch in 'abcdefghijklmnopqrstuvwxyz': cmap[ord(ch)]=cmap[ord(ch.upper())]
    glyph_contours['.notdef']=[[(40,0),(40,700),(440,700),(440,0)],[(100,70),(380,70),(380,630),(100,630)]]; widths['.notdef']=480
    glyph_contours['space']=[]; widths['space']=260; cmap[32]='space'
    glyph_contours['nbsp']=[]; widths['nbsp']=260;cmap[160]='nbsp'
    def add(ch,contours,width=330):
        name='p'+str(ord(ch));glyph_contours[name]=contours;widths[name]=width;cmap[ord(ch)]=name
    add('.',[circle(100,34,30)],200)
    add('·',[circle(100,350,28)],200)
    add('•',[circle(130,350,45)],260)
    add(',', [circle(100,34,30)]+stroke([(110,20),(80,-74)],30),200)
    add(':',[circle(100,34,30),circle(100,390,30)],200)
    add(';',[circle(100,390,30),circle(100,34,30)]+stroke([(110,20),(80,-74)],30),200)
    add('!',stroke([(105,190),(110,690)],52)+[circle(100,34,32)],215)
    add('?',stroke([(55,600),(84,674),(187,701),(274,649),(278,540),(172,437),(158,222)],43)+[circle(153,34,31)],340)
    add("'",stroke([(96,590),(137,730)],42),210)
    add('"',stroke([(85,590),(126,730)],40)+stroke([(205,590),(246,730)],40),310)
    for ch,length in [('-',290),('–',430),('—',620)]: add(ch,stroke([(40,329),(length-35,339)],40),length)
    add('…',[circle(85,34,29),circle(220,34,29),circle(355,34,29)],440)
    for ch,points in [('(',[(235,735),(132,592),(94,333),(131,78),(224,-65)]),(')',[(85,735),(186,592),(224,333),(187,78),(96,-65)]),('[',[(220,730),(80,730),(80,-40),(220,-40)]),(']',[(80,730),(220,730),(220,-40),(80,-40)])]: add(ch,stroke(points,40),310)
    add('+',stroke([(65,339),(415,339)],42)+stroke([(240,159),(240,519)],42),480)
    add('=',stroke([(65,250),(415,250)],42)+stroke([(65,440),(415,440)],42),480)
    add('/',stroke([(52,-18),(343,728)],40),400)
    add('\\',stroke([(52,728),(343,-18)],40),400)
    add('_',stroke([(30,-76),(460,-76)],38),500)
    add('*',sum([stroke([(180,410),(180+145*math.sin(t),410+145*math.cos(t))],35) for t in [0,1.25,2.51,3.77,5.02]],[]),370)
    add('#',sum([stroke(p,37) for p in [[(140,45),(225,670)],[(310,45),(395,670)],[(80,230),(440,230)],[(105,470),(465,470)]]],[]),540)
    add('%',stroke([(45,0),(465,700)],42)+[circle(130,580,84),circle(380,120,84)],530)
    # Hand-drawn ampersand, euro and at sign, not substituted from an external font.
    add('&',stroke([(440,60),(182,460),(102,566),(139,670),(250,696),(318,610),(285,516),(94,307),(72,168),(152,53),(302,51),(456,301)],43),520)
    add('€',stroke([(440,640),(340,705),(182,644),(100,475),(100,225),(187,58),(346,13),(451,77)],43)+stroke([(40,420),(345,420)],40)+stroke([(40,280),(315,280)],40),520)
    add('@',stroke([(340,168),(385,476),(270,518),(183,423),(164,229),(251,178),(339,275),(340,168),(455,192),(518,323),(501,524),(360,680),(163,670),(44,517),(35,250),(145,66),(365,19),(494,82)],36),580)
    add('<',stroke([(350,620),(70,350),(350,80)],40),440)
    add('>',stroke([(90,620),(370,350),(90,80)],40),440)
    add('|',stroke([(110,-50),(110,750)],38),220)
    add('~',stroke([(45,350),(130,410),(270,300),(355,360)],35),410)
    add('^',stroke([(50,570),(200,750),(350,570)],35),400)
    add('`',stroke([(90,760),(180,650)],38),270)
    add('$',glyph_contours[cmap[ord('S')]]+stroke([(220,-60),(230,770)],28),widths[cmap[ord('S')]])
    for a,b in [('‘',"'"),('’',"'"),('“','"'),('”','"')]: cmap[ord(a)]=cmap[ord(b)]
    # Accents are original vector strokes positioned above the corresponding cap.
    accents={'À':('A','grave'),'Á':('A','acute'),'È':('E','grave'),'É':('E','acute'),'Ì':('I','grave'),'Í':('I','acute'),'Ò':('O','grave'),'Ó':('O','acute'),'Ù':('U','grave'),'Ú':('U','acute'),'Ä':('A','diaeresis'),'Ë':('E','diaeresis'),'Ï':('I','diaeresis'),'Ö':('O','diaeresis'),'Ü':('U','diaeresis'),'Ñ':('N','tilde')}
    for ch,(base,kind) in accents.items():
        base_name=cmap[ord(base)]; center=widths[base_name]/2
        if kind=='grave': mark=stroke([(center-65,866),(center+25,762)],35)
        elif kind=='acute': mark=stroke([(center-25,762),(center+65,866)],35)
        elif kind=='diaeresis': mark=[circle(center-70,800,26),circle(center+70,800,26)]
        else: mark=stroke([(center-95,790),(center-35,825),(center+35,775),(center+95,810)],27)
        add(ch,glyph_contours[base_name]+mark,widths[base_name]);cmap[ord(ch.lower())]=cmap[ord(ch)]
    for cp in [8594,8599]:
        points=[(50,340),(530,340)] if cp==8594 else [(70,90),(490,620)]
        arrow=stroke(points,42)+stroke([(360,520),(530,340),(360,160)] if cp==8594 else [(275,600),(490,620),(480,380)],42)
        add(chr(cp),arrow,600)
    add('✓',stroke([(55,270),(192,70),(490,620)],48),550)
    add('♡',[[(50,470),(65,610),(160,670),(270,585),(380,670),(480,610),(495,470),(270,35)],[(270,115),(437,474),(430,572),(381,610),(270,525),(158,610),(112,572),(108,474)]],550)
    add('✳',sum([stroke([(230,350),(230+185*math.sin(t),350+185*math.cos(t))],40) for t in np.linspace(0,2*math.pi,9)[:-1]],[]),470)
    order=['.notdef','space','nbsp']+[n for n in glyph_contours if n not in {'.notdef','space','nbsp'}]
    builder=FontBuilder(1000,isTTF=True);builder.setupGlyphOrder(order);builder.setupCharacterMap(cmap)
    builder.setupGlyf({name:make_glyph(glyph_contours[name]) for name in order});builder.setupHorizontalMetrics({name:(widths[name],0) for name in order})
    builder.setupHorizontalHeader(ascent=950,descent=-220)
    builder.setupNameTable({'familyName':'Balotta Inchiostro','styleName':'Regular','uniqueFontIdentifier':'FacciamoBalotta-Inchiostro-20261106','fullName':'Balotta Inchiostro Regular','psName':'BalottaInchiostro-Regular','version':'Version 1.000','copyright':'Original lettering created for Facciamo Balotta, 2026.'})
    builder.setupOS2(sTypoAscender=950,sTypoDescender=-220,sTypoLineGap=0,usWinAscent=950,usWinDescent=220,sCapHeight=700,sxHeight=700,usWeightClass=500)
    builder.setupPost();builder.setupMaxp();output.parent.mkdir(parents=True,exist_ok=True);builder.save(output)
    (output.parent/'glyph-manifest.json').write_text(json.dumps({'family':'Balotta Inchiostro','source':source.name,'glyphs':manifest,'codePoints':sorted(cmap)},indent=2))
    preview=Image.new('RGB',(1536,1000),'#fff5dc');draw=ImageDraw.Draw(preview)
    for text,y,size,color in [('FACCIAMO BALOTTA!',55,106,'#252923'),('La prossima bella storia',230,79,'#252923'),('inizia fuori.',355,110,'#d44935'),('È già ora di incontrarsi?',560,74,'#252923'),('Arrampicata · calcio · tennis',700,66,'#252923'),('Sabato 14 novembre — 18:30 · 20 €',830,58,'#252923')]:
        draw.text((65,y),text,font=ImageFont.truetype(str(output),size),fill=color)
    preview.save(output.parent/'lettering-specimen.png')
    print(json.dumps({'font':str(output),'glyphs':len(order),'codePoints':len(cmap),'specimen':str(output.parent/'lettering-specimen.png')}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args();build(args.source,args.output)
