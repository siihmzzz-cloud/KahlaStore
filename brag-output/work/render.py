from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, wave, math, subprocess, os

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
WORK=os.path.dirname(__file__)
OUT=os.path.dirname(WORK)
W,H=1920,1080
PAPER=(242,240,235); INK=(21,21,20); MUTED=(119,117,111)
REG='/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
SERIF='/System/Library/Fonts/Supplemental/Georgia.ttf'
def font(size,bold=False,serif=False): return ImageFont.truetype(SERIF if serif else (BOLD if bold else REG),size)
def text(draw,xy,s,size=18,fill=INK,bold=False,spacing=0,serif=False):
    f=font(size,bold,serif)
    if not spacing:
        draw.text(xy,s,font=f,fill=fill)
        return
    x,y=xy
    for ch in s:
        draw.text((x,y),ch,font=f,fill=fill)
        x+=draw.textlength(ch,font=f)+spacing
def canvas(color=PAPER): return Image.new('RGB',(W,H),color)
def crop_fill(src,box):
    return src.crop(box)
def save(im,name): im.save(os.path.join(WORK,name),quality=95)
def fit_width(src,width):
    h=round(src.height*width/src.width)
    return src.resize((width,h),Image.Resampling.LANCZOS)

home=Image.open(os.path.join(WORK,'home-full.png')).convert('RGB')
hero=Image.open(os.path.join(WORK,'hero.png')).convert('RGB')
detail=Image.open(os.path.join(WORK,'detail.png')).convert('RGB')

# 01 — Real storefront hero capture.
save(hero.copy(),'scene-01-hero.png')

# 02 — The real campaign section in its paper-and-image frame.
im=canvas(); d=ImageDraw.Draw(im)
text(d,(150,190),'01   /   A CHANGE OF PACE',14,fill=MUTED,bold=True,spacing=2)
text(d,(150,230),'NEW VIBES.',42,bold=True,spacing=-1)
band=home.crop((0,918,1920,1418))
im.paste(band,(0,330))
text(d,(150,900),'DISCOVER THE PIECES YOU’LL KEEP REACHING FOR.',14,bold=True,spacing=1.5)
save(im,'scene-02-campaign.png')

# 03 — Categories in the site’s actual dark collection strip.
im=canvas(INK); d=ImageDraw.Draw(im)
text(d,(150,190),'02   /   FIND YOUR EDIT',14,fill=(171,169,162),bold=True,spacing=2)
text(d,(150,235),'MEN. WOMEN. KIDS.',45,fill=(245,243,237),bold=True,spacing=0)
band=home.crop((0,752,1920,918))
im.paste(band,(0,420))
text(d,(150,740),'THREE WAYS TO MAKE IT YOURS.',14,fill=(205,203,195),bold=True,spacing=1.6)
save(im,'scene-03-categories.png')

# 04 — Moving type based on the real autonomous editorial ticker.
im=canvas(); d=ImageDraw.Draw(im)
text(d,(150,245),'A NOTE ON',15,bold=True,spacing=3)
text(d,(150,280),'GETTING DRESSED',15,bold=True,spacing=3)
# little downward arrow motif used by the site
x0,y0=166,340; d.line((x0,y0,x0,y0+34),fill=INK,width=2); d.line((x0,y0+34,x0-8,y0+24),fill=INK,width=2); d.line((x0,y0+34,x0+8,y0+24),fill=INK,width=2)
text(d,(1560,262),'03 / 04',12,fill=MUTED,bold=True,spacing=1)
save(im,'scene-04-ticker-base.png')
copy='Every fit tells a story,      discover the details that make your style unmistakably yours,      and find your next everyday essential.'
tf=font(66)
probe=Image.new('RGB',(1,1)); td=ImageDraw.Draw(probe)
copyw=int(td.textlength(copy,font=tf))+260
track=Image.new('RGBA',(copyw*2,190),(0,0,0,0)); tr=ImageDraw.Draw(track)
def draw_copy(x):
    at=x
    parts=['Every fit tells a story,','discover the details that make your style','unmistakably yours,','and find your next','everyday essential.']
    for i,p in enumerate(parts):
        tr.text((at,46),p,font=tf,fill=INK)
        at+=tr.textlength(p,font=tf)+38
        if i==0:
            # Thin curved-arrow approximation between the ticker clauses.
            tr.arc((at,57,at+52,111),205,330,fill=INK,width=2)
            tr.line((at+47,105,at+56,106,at+53,96),fill=INK,width=2)
            at+=95
        elif i<len(parts)-1: at+=28
    # Draw the decorative mark directly so it renders consistently on macOS.
    cx,cy=at+31,78; pts=[]
    for j in range(16):
        radius=25 if j%2==0 else 10
        angle=-math.pi/2+j*math.pi/8
        pts.append((cx+radius*math.cos(angle),cy+radius*math.sin(angle)))
    tr.polygon(pts,fill=(119,117,111))
draw_copy(0); draw_copy(copyw)
track.save(os.path.join(WORK,'ticker-track.png'))
# annotate actual wording in plan and add consistent paper palette

# 05 — Real best-of page section.
im=canvas(); d=ImageDraw.Draw(im)
section=home.crop((0,1726,1920,2478))
im.paste(section,(0,150))
text(d,(150,932),'EVERYDAY ESSENTIALS. UNMISTAKABLE STYLE.',14,fill=MUTED,bold=True,spacing=1.7)
save(im,'scene-05-products.png')

# 06 — Actual product detail screen, framed as a considered close-up.
im=canvas(); d=ImageDraw.Draw(im)
text(d,(150,132),'04   /   MAKE IT YOURS',14,fill=MUTED,bold=True,spacing=2)
text(d,(150,164),'FIND YOUR FIT.',30,bold=True,spacing=0)
panel=detail.crop((0,0,1920,640)).resize((1740,580),Image.Resampling.LANCZOS)
shadow=Image.new('RGBA',(1780,620),(0,0,0,0)); sd=ImageDraw.Draw(shadow); sd.rounded_rectangle((12,12,1768,608),radius=3,fill=(0,0,0,26)); shadow=shadow.filter(ImageFilter.GaussianBlur(15))
im=im.convert('RGBA'); im.alpha_composite(shadow,(70,245)); im.paste(panel,(90,255)); im=im.convert('RGB')
text(ImageDraw.Draw(im),(150,890),'STUDIO HEAVYWEIGHT TEE     /     SELECT A SIZE     /     ADD TO BAG',13,fill=MUTED,bold=True,spacing=1)
save(im,'scene-06-product-detail.png')

# 07 — Simple, brand-faithful end card.
im=canvas(); d=ImageDraw.Draw(im)
d.line((150,220,1770,220),fill=(217,214,206),width=1)
text(d,(150,264),'KA7LA',112,bold=True,spacing=5)
text(d,(625,296),'STORE',19,bold=True,spacing=4)
text(d,(154,440),'EVERYDAY ESSENTIALS.',19,bold=True,spacing=4)
text(d,(154,482),'UNMISTAKABLE STYLE.',19,bold=True,spacing=4)
text(d,(154,808),'KA7LA STORE',14,fill=MUTED,bold=True,spacing=2)
text(d,(154,844),'EVERYDAY, CONSIDERED.',12,fill=MUTED,spacing=2)
d.line((150,900,1770,900),fill=(217,214,206),width=1)
text(d,(150,930),'EXPLORE THE COLLECTION',12,fill=MUTED,bold=True,spacing=1.5)
save(im,'scene-07-end.png')

# Brand-new, quiet electronic bed: warm four-note pads and a soft pulse.
duration=19.35; sr=48000; n=int(duration*sr); t=np.arange(n,dtype=np.float64)/sr
music=np.zeros(n,dtype=np.float64)
# Dm9 / Bbmaj7 / Fmaj7 / Cadd9, slowly shifting every 1.8 seconds.
chords=[[146.83,174.61,220.00,261.63],[116.54,146.83,174.61,220.00],[174.61,220.00,261.63,349.23],[130.81,164.81,196.00,261.63]]
block=1.8
for j in range(math.ceil(duration/block)):
    a=int(j*block*sr); b=min(n,int((j+1)*block*sr)); q=t[a:b]-j*block
    env=np.minimum(1,np.maximum(0,q/.30))*np.minimum(1,np.maximum(0,(block-q)/.45))
    for k,freq in enumerate(chords[j%len(chords)]):
        music[a:b]+=0.012*env*np.sin(2*np.pi*freq*q+k*.12)
    # rounded sub pulse, four gentle hits in each bar
    root=chords[j%len(chords)][0]/2
    bassenv=np.exp(-np.maximum(0,q-.04)*5)*np.where(q<.055,q/.055,1)
    music[a:b]+=0.035*bassenv*np.sin(2*np.pi*root*q)
# soft tick at 82 BPM; subdued enough to sit under the visual
beat=60/82
for k in range(int(duration/beat)+1):
    a=int(k*beat*sr); b=min(n,a+int(.12*sr)); q=np.arange(b-a)/sr
    if b>a:
        music[a:b]+=0.012*np.exp(-q*35)*np.sin(2*np.pi*(1450 if k%2 else 900)*q)
fade=int(sr*.9); music[:fade]*=np.linspace(0,1,fade); music[-fade:]*=np.linspace(1,0,fade)
music=np.clip(music,-.8,.8)
stereo=(np.clip(np.column_stack((music,music*.96)),-1,1)*32767).astype(np.int16)
with wave.open(os.path.join(WORK,'music.wav'),'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(stereo.tobytes())

# Render each visual passage, using gentle camera motion and an actual continuously
# moving type strip for the ticker. Then join them with restrained cross-dissolves.
ff='/opt/homebrew/bin/ffmpeg'
if not os.path.exists(ff): ff='ffmpeg'
segments=[
 ('scene-01-hero.png',3.3),('scene-02-campaign.png',2.7),('scene-03-categories.png',2.0),
 ('ticker',4.2),('scene-05-products.png',3.5),('scene-06-product-detail.png',3.7),('scene-07-end.png',2.4)
]
for idx,(name,dur) in enumerate(segments):
    dest=os.path.join(WORK,f'clip-{idx+1:02}.mp4')
    frames=round(dur*30)
    if name=='ticker':
        pause=.75; speed=copyw/(dur-pause)
        expr=f"[0:v]fps=30,trim=duration={dur},setpts=PTS-STARTPTS[base];[1:v]format=rgba[track];[base][track]overlay=x='-mod(max(0\\,t-{pause})*{speed:.6f}\\,{copyw})':y=440:shortest=1,fps=30,trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p[v]"
        args=[ff,'-y','-loop','1','-framerate','30','-i',os.path.join(WORK,'scene-04-ticker-base.png'),'-loop','1','-framerate','30','-i',os.path.join(WORK,'ticker-track.png'),'-filter_complex',expr,'-map','[v]','-an','-t',str(dur),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',dest]
    else:
        src=os.path.join(WORK,name)
        vf=f"zoompan=z='min(zoom+0.00034,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps=30,trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p"
        args=[ff,'-y','-loop','1','-framerate','30','-i',src,'-vf',vf,'-an','-t',str(dur),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',dest]
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

# Overlap each shot by 350 ms. Audio gets matching soft crossfades.
filter_parts=[]; labels=[]
for i,(_,dur) in enumerate(segments):
    filter_parts.append(f'[{i}:v]settb=AVTB,fps=30,format=yuv420p[v{i}]')
    labels.append(f'[v{i}]')
current=labels[0]; offset=segments[0][1]
for i in range(1,len(segments)):
    out=f'x{i}'
    off=offset-.35
    filter_parts.append(f'{current}{labels[i]}xfade=transition=fade:duration=0.35:offset={off:.3f}[{out}]')
    current=f'[{out}]'; offset=off+segments[i][1]
audio_inputs=''.join(f'[{i}:a]' for i in [])
audio_filter='[7:a]afade=t=in:st=0:d=0.8,afade=t=out:st=18.4:d=0.9,volume=4.5[aout]'
filter_complex=';'.join(filter_parts+[audio_filter])
args=[ff,'-y']
for i in range(len(segments)): args += ['-i',os.path.join(WORK,f'clip-{i+1:02}.mp4')]
args += ['-i',os.path.join(WORK,'music.wav'),'-filter_complex',filter_complex,'-map',current,'-map','[aout]','-t','19.35','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',os.path.join(OUT,'brag.mp4')]
subprocess.run(args,check=True)
# Poster is extracted from frame zero of the final encoded film.
subprocess.run([ff,'-y','-i',os.path.join(OUT,'brag.mp4'),'-frames:v','1','-q:v','2',os.path.join(OUT,'brag.jpg')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print(f'created {os.path.join(OUT,"brag.mp4")} at {offset:.2f}s')
