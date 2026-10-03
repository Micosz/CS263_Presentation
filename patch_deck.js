// Patch CS263 index.html: crisp zoom, live thumbnails, slide text aligned with V5.
// Usage: node patch_deck.js <in.html> <out.html>
const fs = require('fs');
const [inp, out] = process.argv.slice(2);
let s = fs.readFileSync(inp, 'utf8');

function rep(from, to) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, got ${n}: ${from.slice(0, 80)}`);
  s = s.replace(from, to);
}

// 1. Blur: #world was promoted with will-change:transform, so Chrome kept the
//    raster from scale ~1 and magnified it 5x when zooming into a chapter.
rep('#world{position:absolute;transform-origin:0 0;will-change:transform}',
    '#world{position:absolute;transform-origin:0 0}');

// 2. Thumbnails: render a scaled copy of the real slide instead of the stored PNGs
//    (stored thumbs for pages 14-15 still showed the old diagrams).
rep("transformOrigin:'0 0'});s.nodes.forEach(n=>{let el;",
    "transformOrigin:'0 0'});buildNodes(s,i,frame,true);world.appendChild(frame);frames.set(i,frame)}\nfunction buildNodes(s,i,frame,live){s.nodes.forEach(n=>{let el;");
rep("if(s.kind==='appendix'){el=document.createElement('button')",
    "if(s.kind==='appendix'&&live){el=document.createElement('button')");
rep("frame.appendChild(el)});world.appendChild(frame);frames.set(i,frame)}",
    "frame.appendChild(el)})}");
rep("const im=document.createElement('img');im.src=thumbs[i];im.alt=slides[i].title;b.appendChild(im);",
    "const m=document.createElement('div');m.className='slide thumb-live';m.setAttribute('aria-hidden','true');m.style.transform='scale('+(r.w-(cls==='film-thumb'?6:4))/1600+')';buildNodes(slides[i],i,m,false);b.appendChild(m);");
rep('</style></head>',
    '.thumb-live{left:0;top:0;transform-origin:0 0;pointer-events:none;box-shadow:none!important}</style></head>');

// 3. Slide content aligned with V5 (§1.2, §1.3 table, BOM chain, Fishbone v4).
const a = s.indexOf('const slides=') + 13;
let d = 0, e = a;
for (; e < s.length; e++) { if (s[e] === '[') d++; else if (s[e] === ']') { d--; if (!d) break; } }
const slides = JSON.parse(s.slice(a, e + 1));
const txt = (sl, old, neu) => {
  const n = sl.nodes.find(n => n.type === 'text' && n.text === old);
  if (!n) throw new Error('text not found: ' + old);
  n.text = neu; return n;
};

// Slide 3 — 1.1 (evidence-based, no hedge, attributed numbers)
{
  const sl = slides[2];
  txt(sl, 'บันทึกห้อง ผู้รับผิดชอบ\nและสภาพเพื่อใช้ตรวจนับ', 'เปิดแก้ไขได้เฉพาะ\nรอบตรวจนับปีละครั้ง');
  txt(sl, 'ไม่ได้บันทึกการเปลี่ยนแปลง\nอย่างต่อเนื่อง', 'ไม่มีช่องทางบันทึก ข้อมูลห้อง\nและผู้รับผิดชอบจึงไม่ตรงของจริง');
  txt(sl, 'ข้อมูลอาจไม่ตรงกับของจริง\nและดูประวัติย้อนหลังไม่สะดวก', 'ผู้รู้ตำแหน่งคือผู้รับผิดชอบ\nประวัติย้อนหลังต้องค้นด้วยมือ');
  txt(sl, 'ครุภัณฑ์มากกว่า 2,000 รายการ', 'ผู้ให้สัมภาษณ์ระบุ: ตรวจนับใช้ 2–3 สัปดาห์');
  txt(sl, 'จึงต้องบันทึกการเปลี่ยนแปลงระหว่างปี เพื่อช่วยเตรียมข้อมูลตรวจนับ',
      'ทำงานจริงราว 4 วัน กับครุภัณฑ์ราว 2,000 รายการขึ้นไป ส่วนที่ยากคือการตามหาของ');
  sl.notes = 'ปัจจุบันสาขาใช้ Excel จากคณะประกอบการตรวจนับปีละครั้ง จากการสัมภาษณ์ ไฟล์เปิดแก้ไขได้เฉพาะรอบตรวจนับ เมื่อผู้รับผิดชอบย้ายหรือส่งต่อของระหว่างปี ส่วนใหญ่เพราะของชำรุดและต้องเอาของมาแทน จึงไม่มีช่องทางบันทึก ข้อมูลห้องและผู้รับผิดชอบเลยไม่ตรงกับของจริง ตอนตรวจนับ ถ้าของไม่อยู่ห้องเดิม ต้องเดินหาและถามผู้รับผิดชอบ เพราะคนที่รู้ว่าของไปไหนคือผู้รับผิดชอบ ไม่ใช่กรรมการตรวจนับที่แต่งตั้งหมุนเวียน ผู้ให้สัมภาษณ์ระบุว่าใช้ 2–3 สัปดาห์ ทำงานจริงราว 4 วัน กับของราว 2,000 รายการขึ้นไป ตัวเลขเป็นคำบอกเล่า ยังไม่ได้วัด';
}

// Slide 4 — 1.2: one objective per BO, same order as V5
{
  const sl = slides[3];
  const imgs = sl.nodes.filter(n => n.type === 'image');           // 🔍 🕘 ⏱️ 🔄 by column
  const [search, history, timer, review] = imgs.map(n => ({ image: n.image, alt: n.alt }));
  [timer, search, history, review].forEach((v, k) => Object.assign(imgs[k], v));
  txt(sl, 'ตรวจข้อมูลสะดวก', 'BO-1 ลดเวลาติดตาม');
  txt(sl, 'ลดการสอบถามซ้ำ', 'ลดเวลาและการสอบถาม\nในการระบุที่ตั้งและผู้รับผิดชอบ');
  txt(sl, 'ตรวจสอบย้อนหลัง', 'BO-2 ข้อมูลตรงของจริง');
  txt(sl, 'ดูประวัติการย้ายและส่งต่อ', 'ห้องและผู้รับผิดชอบ\nตรงกับของจริงตลอดปี');
  txt(sl, 'ลดเวลาติดตาม', 'BO-3 ตามหาจากประวัติ');
  txt(sl, 'เตรียมข้อมูลประกอบการตรวจนับ', 'ของที่ไม่อยู่ตามที่บันทึก\nตามได้จากประวัติการย้าย');
  txt(sl, 'ทบทวนตามรอบ', 'BO-4 สถานะเป็นปัจจุบัน');
  txt(sl, 'ปรับข้อมูลครุภัณฑ์ระหว่างปี', 'สถานะการใช้งาน\nทบทวนตามรอบที่กำหนด');
  txt(sl, 'ข้อมูลครุภัณฑ์เป็นปัจจุบัน • ตรวจสอบย้อนหลังได้ • สนับสนุนการตรวจนับ',
      'ข้อมูลปรับปรุงระหว่างปี • ตรวจสอบได้ตามสิทธิ์ • สนับสนุนการตรวจนับประจำปี');
  sl.notes = 'วัตถุประสงค์สี่ข้อ หนึ่งข้อต่อหนึ่ง BO ข้อแรกลดเวลาและการสอบถามในการระบุที่ตั้งและผู้รับผิดชอบ ข้อสองให้ห้องและผู้รับผิดชอบในระบบตรงกับของจริงตลอดปี ข้อสามถ้าของไม่อยู่ตามที่บันทึก ให้ตามได้จากประวัติการย้าย ข้อสี่ให้สถานะการใช้งานเป็นปัจจุบันตามรอบทบทวน วิสัยทัศน์คือข้อมูลที่ปรับระหว่างปีและสนับสนุนการตรวจนับ เราไม่ได้จะหยุดการย้าย แต่ให้ข้อมูลตามการย้ายทัน';
}

// Slide 5 — 1.3: all 9 metrics from V5 table, grouped by BO
{
  const sl = slides[4];
  const keep = sl.nodes.filter(n => n.type === 'text' && n.y < 120);  // section label + title
  const rows = [
    ['BO-1', 'BO', 'เวลาติดตามข้อมูล', 'ลด ≥20%', 20, 'เวลาเฉลี่ยต่อรายการ ก่อนใช้ระบบ เทียบกับเดือนแรกของการทดลองใช้'],
    ['BO-1', 'SM', 'ตรวจสอบโดยไม่ถามเพิ่ม', '≥95%', 95, 'ตรวจสอบสำเร็จโดยไม่สอบถามบุคคลเพิ่ม · เดือนแรก'],
    ['BO-2', 'BO', 'ที่ตั้งและผู้รับผิดชอบตรงของจริง', '≥95%', 95, 'สุ่มตรวจ ตรงทั้งห้องและผู้รับผิดชอบ · รอบตรวจนับประจำปีแรก'],
    ['BO-2', 'SM', 'ข้อมูลครบถ้วน', '≥95%', 95, 'รหัส ชื่อ ห้อง ผู้รับผิดชอบ สภาพ วันที่ปรับปรุง · เดือนแรก'],
    ['BO-2', 'SM', 'ส่งแจ้งเตือนสำเร็จ', '≥95%', 95, 'ถึงบัญชีที่เชื่อม LINE ไม่รวมอัตราการอ่าน · เดือนแรก'],
    ['BO-3', 'BO', 'ตามหาได้จากประวัติ', '≥90%', 90, 'กรณีไม่พบ ณ ห้องที่บันทึก ตามพบจากประวัติ · รอบตรวจนับประจำปีแรก'],
    ['BO-3', 'SM', 'ประวัติครบถ้วน', '100%', 100, 'ก่อน–หลัง วันที่ เหตุผล ผู้ดำเนินการ · เดือนแรก'],
    ['BO-4', 'BO', 'สถานะตรงกับของจริง', '≥90%', 90, 'สุ่มตรวจสถานะเทียบสภาพจริง · รอบตรวจนับประจำปีแรก'],
    ['BO-4', 'SM', 'ทบทวนตามรอบ', '≥90%', 90, 'ผู้รับผิดชอบบันทึกผลทบทวนครบภายในรอบ · รอบทบทวนแรก'],
  ];
  const nodes = [...keep,
    { type: 'text', x: 90, y: 162, w: 1400, size: 22, color: '#576d79', text: 'BO = ผลลัพธ์ทางธุรกิจ • SM = ตัวชี้วัดล่วงหน้า • เป้าหมายที่กลุ่มเสนอ ยังไม่ใช่ผลการทดลอง', build: 1 }];
  rows.forEach(([bo, kind, name, goal, val, how], k) => {
    const y = 212 + k * 64, isBO = kind === 'BO';
    nodes.push(
      { type: 'text', x: 90, y, w: 120, size: 18, color: '#24715d', bold: true, text: bo + ' · ' + kind, build: 1 },
      { type: 'text', x: 200, y: y - 3, w: 300, size: 22, color: isBO ? '#183345' : '#576d79', bold: isBO, text: name, build: 1 },
      { type: 'rect', x: 505, y: y + 4, w: 775, h: 14, color: '#e0e7e1', build: 0, radius: 7 },
      { type: 'rect', x: 505, y: y + 4, w: 775 * val / 100, h: 14, color: val === 20 ? '#ad7d46' : '#24715d', build: 0, radius: 7, chart: true, order: k, value: val },
      { type: 'text', x: 505, y: y + 24, w: 790, size: 17, color: '#576d79', text: how, build: 1 },
      { type: 'text', x: 1320, y: y - 4, w: 200, size: 26, color: '#24715d', bold: true, text: goal, build: 1 });
  });
  nodes.push({ type: 'text', x: 90, y: 800, w: 1410, size: 19, color: '#576d79', build: 1,
    text: 'ยังไม่มีค่าเริ่มต้น (baseline) ต้องสุ่มตรวจข้อมูลปัจจุบันเทียบของจริงและเก็บเวลาติดตามก่อนเปิดใช้ แล้วทบทวนเป้าหมาย' });
  sl.nodes = nodes;
  sl.notes = 'ตัวชี้วัดเก้าตัว จัดตาม BO สี่ข้อ ตัวที่เป็น BO วัดผลลัพธ์ ตัวที่เป็น SM เป็นตัวชี้วัดล่วงหน้าที่ดูได้ตั้งแต่เดือนแรก BO-1 ลดเวลาติดตามต่อรายการอย่างน้อย 20% BO-2 ห้องและผู้รับผิดชอบตรงของจริงอย่างน้อย 95% BO-3 กรณีหาไม่เจอ ตามได้จากประวัติอย่างน้อย 90% BO-4 สถานะตรงอย่างน้อย 90% สาม BO หลังวัดตอนตรวจนับ เพราะการย้ายเกิดไม่บ่อย ผลจึงเห็นชัดตอนนับ ตัวเลขทั้งหมดเป็นเป้าที่กลุ่มเสนอ ยังไม่มี baseline ต้องสุ่มตรวจก่อนเปิดใช้';
}

// Slide 13 — 3.3: "ป้ายไม่ชัด" was a misreading; source = some items not numbered yet
{
  const sl = slides[12];
  txt(sl, 'มากกว่า 2,000 รายการ; บางป้ายไม่ชัด\nใช้รุ่น ยี่ห้อ Serial Number หรือประวัติ',
      'ราว 2,000 รายการ บางชิ้นยังไม่ติดเลข\nใช้รุ่น ยี่ห้อ Serial Number หรือประวัติ');
  sl.notes = sl.notes.replace('ตรวจยืนยันครุภัณฑ์เมื่อป้ายไม่ชัด', 'ตรวจยืนยันตัวครุภัณฑ์เมื่อบางชิ้นยังไม่ได้ติดเลข');
}

// Slides 14-15 — appendix captions + notes for the new diagrams
{
  const fb = slides[13], bom = slides[14];
  const fbCap = fb.nodes.find(n => n.type === 'text' && n.y > 780);
  fbCap.text = 'สาเหตุที่การตรวจนับต้องค้นหาตามห้องและสอบถามผู้รับผิดชอบเพิ่มเติม จากการสัมภาษณ์สองรอบ';
  fb.notes = 'จากสัมภาษณ์สองรอบ ปัญหาคือตอนตรวจนับ ถ้าของไม่อยู่ห้องเดิม ต้องเดินหาและถามผู้รับผิดชอบ วิธีการ: ข้อมูลห้องกับผู้รับผิดชอบไม่ตรง เพราะการย้ายระหว่างปีไม่ได้บันทึก ไม่ใช่ใครทำผิด แต่ Excel เปิดแก้ได้แค่ตอนตรวจนับ การย้ายส่วนใหญ่เกิดเพราะของชำรุด บุคลากร: คนที่รู้ว่าของอยู่ไหนคือผู้รับผิดชอบ ไม่ใช่กรรมการที่หมุนเวียน และคนใหม่ไม่รู้ว่าต้องค้นยังไง ตัวครุภัณฑ์: ของจำนวนมาก หลายชิ้นชื่อและหน้าตาเหมือนกัน บางชิ้นยังไม่ได้ติดเลขเพราะเลขจากคณะออกช้า ข้อมูลในไฟล์: ชื่อรายการไม่สม่ำเสมอ และประวัติการย้ายเป็นหมายเหตุที่ต้องค้นด้วยมือ กดถัดไปครั้งแรกเพื่อซูมแผนภาพ';
  const bomCap = bom.nodes.find(n => n.type === 'text' && n.y > 780);
  bomCap.text = 'ปัญหาหลักนำไปสู่ปัญหาย่อยและวัตถุประสงค์ที่ละเอียดขึ้น แล้วเชื่อมไปยัง Solution Concept · ค่าเป้าหมายเป็นข้อเสนอของกลุ่ม';
  bom.notes = 'อ่านซ้ายไปขวา ปัญหาหลักนำไปสู่เป้า แล้วแตกเป็นปัญหาย่อย โซ่แรก: ต้องเดินหาและถาม ใช้ 2–3 สัปดาห์ ไปที่ BO-1 ลดเวลาต่อรายการอย่างน้อย 20% จะลดได้ต้องแก้สองอย่าง: ย้ายแล้วไม่ได้บันทึก ไปที่ BO-2 ห้องและผู้รับผิดชอบตรงอย่างน้อย 95% ด้วยฟีเจอร์ย้ายหรือส่งต่อและผู้รับยืนยัน และหาไม่เจอแล้วไม่มีอะไรให้ตาม ไปที่ BO-3 ตามได้จากประวัติอย่างน้อย 90% โซ่ที่สองแยกกัน: สถานะที่ต้องรายงานคณะอัปเดตได้ปีละครั้ง ไปที่ BO-4 สถานะตรงอย่างน้อย 90% ด้วย LINE เตือนทบทวนตามรอบ ตัวเลขเป็นเป้าที่กลุ่มเสนอ ยังไม่มี baseline กดถัดไปครั้งแรกเพื่อซูมแผนภาพ';
}

s = s.slice(0, a) + JSON.stringify(slides) + s.slice(e + 1);
fs.writeFileSync(out, s);
console.log('ok', s.length);
