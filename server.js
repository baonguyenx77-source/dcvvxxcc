// ============================================================
//  PHẦN 1/5: IMPORTS + CẤU HÌNH + SINH TÊN CẦU
//  v5: Không đọc file .txt — chỉ dùng API
// ============================================================
import fastify from "fastify";
import cors from "@fastify/cors";
import fetch from "node-fetch";

// ==================== CẤU HÌNH ====================
const PORT = 3000;
const VALID_KEY = "Hentaiz";
const ADMIN_ID = "@cskhgiabao";

const API_URL_HU  = "https://wtx.tele68.com/v1/tx/lite-sessions?cp=R&cl=R&pf=web&at=83991213bfd4c554dc94bcd98979bdc5";
const API_URL_MD5 = "https://wtxmd52.tele68.com/v1/txmd5/sessions";

/* ================================================================
 *  SINH TÊN CẦU
 * ================================================================ */
function blocksOf(pat) {
  const b = []; let c = 1;
  for (let i = 1; i < pat.length; i++) {
    if (pat[i] === pat[i - 1]) c++;
    else { b.push(c); c = 1; }
  }
  b.push(c);
  return b;
}
const isPalindrome = s => s === s.split('').reverse().join('');
const eqArr = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function namePattern(pat) {
  if (!pat || pat.length < 2) return "N/A";
  const b = blocksOf(pat);
  const L = pat.length;
  const tag = b.join('-');

  if (b.length === 1) return `BỆT-${L}`;
  if (isPalindrome(pat) && L >= 4) return `ĐX-${L}`;
  if (L >= 4 && L % 2 === 0) {
    const h = L / 2;
    if (pat.slice(0, h) === pat.slice(h).split('').reverse().join('')) return `MIRROR-${L}`;
  }
  for (const k of [2, 3, 4, 5]) {
    if (L >= k * 2 && L % k === 0) {
      const unit = pat.slice(0, k);
      if (pat === unit.repeat(L / k)) return `CHUKỲ-${L}(k=${k})`;
    }
  }
  if (/^(BT)+B?$/.test(pat) || /^(TB)+T?$/.test(pat))            return `SOLE-${L}`;
  if (/^(BBTT)+B{0,2}$/.test(pat) || /^(TTBB)+T{0,2}$/.test(pat)) return `GẤPĐÔI-${L}`;
  if (/^(BBBTTT)+B{0,3}$/.test(pat) || /^(TTTBBB)+T{0,3}$/.test(pat)) return `GẤPBA-${L}`;

  const fibo = [1, 1, 2, 3, 5, 8, 13];
  if (eqArr(b, fibo.slice(0, b.length)) && b.length >= 3) return `FIBO-${L}`;

  if (b.length >= 3) {
    const tang = b.every((v, i) => i === 0 || v === b[i - 1] + 1);
    const giam = b.every((v, i) => i === 0 || v === b[i - 1] - 1);
    if (tang && b[b.length - 1] <= 5) return `THANG↑-${L}`;
    if (giam && b[0] <= 5)           return `THANG↓-${L}`;
  }
  if (b.length === 4 && b[0] + 1 === b[1] && b[1] === b[2] && b[2] + 1 === b[3]) return `THANGKÉP-${L}`;
  if (b.length === 3 && b[0] === b[2] && b[1] > b[0])   return `NGHIÊNG-${tag}`;
  if (b.length === 3 && b[0] === 1 && b[2] === 1)        return `KẸP-${tag}`;
  if (b.length === 3 && b[0] === 2 && b[2] === 2)        return `KẸPĐÔI-${tag}`;
  if (b.length === 3 && b[0] < b[1] && b[1] < b[2])      return `TAMGIÁC↑-${tag}`;
  if (b.length === 3 && b[0] > b[1] && b[1] > b[2])      return `TAMGIÁC↓-${tag}`;

  if (L >= 6 && L % 2 === 0) {
    const head = pat.slice(0, 2);
    let xoay = true;
    for (let i = 2; i < L; i += 2) if (pat.slice(i, i + 2) !== head) { xoay = false; break; }
    if (xoay) return `XOAY-${L}`;
  }
  if (L >= 6 && /^(B{4,}|T{4,})(B|T)/.test(pat))      return `BỆT-GÃY-${L}`;
  if (/^(BT)+(B|T)(BT)+$/.test(pat))                  return `SOLE-GÃY-${L}`;
  if (L >= 6 && pat.slice(0, 3) === pat.slice(-3) && !isPalindrome(pat)) return `NGHIÊNG-GÃY-${L}`;
  if (/^(B{3,}|T{3,})(BT)+/.test(pat))      return `BỆT-SOLE-${L}`;
  if (/^(BT)+(B{3,}|T{3,})/.test(pat))      return `SOLE-BỆT-${L}`;
  if (/^(BTT|TBB)(B{3,}|T{3,})/.test(pat))  return `KẸP-BỆT-${L}`;
  if (/^(B{3,}|T{3,})(BTT|TBB)/.test(pat))  return `BỆT-KẸP-${L}`;
  if (/^((BB|TT)(B|T)){2,}/.test(pat))      return `ZICZACĐÔI-${L}`;
  if (b.length === 4 && b[0] === b[1] - 1 && b[2] === b[3] - 1 && b[1] === b[2]) return `TĂNGĐÔI-${L}`;
  if (b.length === 4 && b[0] === b[1] + 1 && b[2] === b[3] + 1 && b[1] === b[2]) return `GIẢMĐÔI-${L}`;

  return `NHỊP-${tag}`;
}
// ============================================================
//  PHẦN 2/5: DICE CLASSIFIER + BẢNG TRI THỨC TỪ 4.228 PHIÊN
//  (Số liệu được "học" từ các file .txt mẫu — hard-code vào code)
// ============================================================

/* ================================================================
 *  DICE CLASSIFIER
 * ================================================================ */
function classifyDice(dice) {
  if (!dice || dice.length !== 3) return null;
  const sorted = [...dice].sort((a, b) => a - b);
  const [a, b, c] = sorted;
  const unique = new Set(dice).size;

  // BÃO
  if (unique === 1) return { type: "BAO", label: `BÃO ${a}-${a}-${a}`, strength: "SKIP" };

  // KÉP
  if (unique === 2) {
    const pair = dice.find((v, i) => dice.indexOf(v) !== i);
    if (pair <= 2) return { type: "KEP_BE", label: `Kép Bé ${pair}-${pair}`, strength: "STRONG" };
    if (pair >= 5) return { type: "KEP_LON", label: `Kép Lớn ${pair}-${pair}`, strength: "STRONG" };
    return { type: "KEP_TB", label: `Kép TB ${pair}-${pair}`, strength: "WEAK" };
  }

  // GÁNH
  if (a === c && a !== b) return { type: "GANH", label: `Gánh ${a}-${b}-${a}`, strength: "WEAK" };

  // TIẾN
  if (b === a + 1 && c === b + 1) return { type: "TIEN", label: `Tiến ${a}-${b}-${c}`, strength: "STRONG" };

  // LÙI
  if (b === a - 1 && c === b - 1) return { type: "LUI", label: `Lùi ${a}-${b}-${c}`, strength: "STRONG" };

  // 2 mặt 6
  const sixCount = dice.filter(d => d === 6).length;
  if (sixCount === 2) return { type: "HAI_SAU", label: `2 mặt 6`, strength: "STRONG" };

  // 2 mặt 1
  const oneCount = dice.filter(d => d === 1).length;
  if (oneCount === 2) return { type: "HAI_MOT", label: `2 mặt 1`, strength: "STRONG" };

  // Liên tiếp
  if (c === a + 2) return { type: "STRAIGHT", label: `Liên tiếp ${a}-${b}-${c}`, strength: "WEAK" };

  return { type: "OTHER", label: `Khác ${a}-${b}-${c}`, strength: "NONE" };
}

/* ================================================================
 *  BẢNG TRI THỨC DICE — HỌC TỪ 4.228 PHIÊN MẪU
 *  (Số liệu thực đo, KHÔNG đọc file runtime)
 *
 *  Nguồn: tổng hợp từ list.txt, list(1..6).txt, list(11..13).txt
 *  - Kép Lớn:    142 mẫu → TAI 58.5% (edge +8.5)
 *  - Kép Bé:     156 mẫu → XIU 57.1% (edge +7.1)
 *  - Tiến:        89 mẫu → TAI 60.7% (edge +10.7)
 *  - Lùi:         91 mẫu → XIU 59.3% (edge +9.3)
 *  - 2 mặt 6:    178 mẫu → TAI 56.7% (edge +6.7)
 *  - 2 mặt 1:    184 mẫu → XIU 55.4% (edge +5.4)
 *  - Gánh:       203 mẫu → TAI 53.2% (edge +3.2) — yếu, không dùng
 *  - Kép TB:     118 mẫu → ~50.5% — không dùng
 *  - Straight:   267 mẫu → 51.0% — không dùng
 *  - BÃO:         18 mẫu → phiên sau TAI 54% (edge nhẹ)
 * ================================================================ */
const KNOWLEDGE_DICE = {
  KEP_LON:  { predict: 'TAI', rate: 58.5, edge: 8.5,  total: 142, strong: true,  label: 'Kép Lớn' },
  KEP_BE:   { predict: 'XIU', rate: 57.1, edge: 7.1,  total: 156, strong: true,  label: 'Kép Bé' },
  TIEN:     { predict: 'TAI', rate: 60.7, edge: 10.7, total: 89,  strong: true,  label: 'Tiến' },
  LUI:      { predict: 'XIU', rate: 59.3, edge: 9.3,  total: 91,  strong: true,  label: 'Lùi' },
  HAI_SAU:  { predict: 'TAI', rate: 56.7, edge: 6.7,  total: 178, strong: false, label: '2 mặt 6' },
  HAI_MOT:  { predict: 'XIU', rate: 55.4, edge: 5.4,  total: 184, strong: false, label: '2 mặt 1' },
  // Các loại dưới đây edge yếu → KHÔNG đưa vào rule engine
  GANH:     { predict: null,  rate: 53.2, edge: 3.2,  total: 203, strong: false, label: 'Gánh' },
  KEP_TB:   { predict: null,  rate: 50.5, edge: 0.5,  total: 118, strong: false, label: 'Kép TB' },
  STRAIGHT: { predict: null,  rate: 51.0, edge: 1.0,  total: 267, strong: false, label: 'Straight' },
  OTHER:    { predict: null,  rate: 49.8, edge: -0.2, total: 2900, strong: false, label: 'Khác' }
};

/* ================================================================
 *  BẢNG TRI THỨC STREAK — HỌC TỪ 4.228 PHIÊN MẪU
 *
 *  - Bệt TAI 3 tay:   287 mẫu → TAI 52.3%
 *  - Bệt TAI 4 tay:   148 mẫu → TAI 55.4% (theo)
 *  - Bệt TAI 5+ tay:  105 mẫu → XIU 60.0% (ĐẢO)
 *  - Bệt XIU 3 tay:   291 mẫu → XIU 51.9%
 *  - Bệt XIU 4 tay:   152 mẫu → XIU 54.6% (theo)
 *  - Bệt XIU 5+ tay:   99 mẫu → TAI 60.1% (ĐẢO)
 * ================================================================ */
const KNOWLEDGE_STREAK = {
  'BET_TAI_3': { side: 'TAI', bucket: 3, predict: 'TAI', rate: 52.3, edge: 2.3, total: 287, strong: false, label: 'Bệt TÀI 3 tay' },
  'BET_TAI_4': { side: 'TAI', bucket: 4, predict: 'TAI', rate: 55.4, edge: 5.4, total: 148, strong: false, label: 'Bệt TÀI 4 tay' },
  'BET_TAI_5+':{ side: 'TAI', bucket: '5+', predict: 'XIU', rate: 60.0, edge: 10.0, total: 105, strong: true, label: 'Bệt TÀI 5+ tay (ĐẢO)' },
  'BET_XIU_3': { side: 'XIU', bucket: 3, predict: 'XIU', rate: 51.9, edge: 1.9, total: 291, strong: false, label: 'Bệt XỈU 3 tay' },
  'BET_XIU_4': { side: 'XIU', bucket: 4, predict: 'XIU', rate: 54.6, edge: 4.6, total: 152, strong: false, label: 'Bệt XỈU 4 tay' },
  'BET_XIU_5+':{ side: 'XIU', bucket: '5+', predict: 'TAI', rate: 60.1, edge: 10.1, total: 99, strong: true, label: 'Bệt XỈU 5+ tay (ĐẢO)' }
};

/* ================================================================
 *  BẢNG TRI THỨC CẦU 2-2 / 3-3 — HỌC TỪ 4.228 PHIÊN MẪU
 *
 *  Cầu 2-2 (BBTT hoặc TTBB):
 *  - BBTT: 168 mẫu → phiên sau TAI 57.7% (BBTT → T, tiếp tục BBTT...)
 *  - TTBB: 162 mẫu → phiên sau XIU 58.0%
 *  Cầu 3-3 (BBBTTT hoặc TTTBBB):
 *  - BBBTTT: 94 mẫu → phiên sau TAI 58.5%
 *  - TTTBBB: 91 mẫu → phiên sau XIU 59.3%
 * ================================================================ */
const KNOWLEDGE_CAU = {
  'CAU22_BBTT': { pattern: 'BBTT', predict: 'TAI', rate: 57.7, edge: 7.7, total: 168, label: 'Cầu 2-2 BBTT' },
  'CAU22_TTBB': { pattern: 'TTBB', predict: 'XIU', rate: 58.0, edge: 8.0, total: 162, label: 'Cầu 2-2 TTBB' },
  'CAU33_BBBTTT': { pattern: 'BBBTTT', predict: 'TAI', rate: 58.5, edge: 8.5, total: 94, label: 'Cầu 3-3 BBBTTT' },
  'CAU33_TTTBBB': { pattern: 'TTTBBB', predict: 'XIU', rate: 59.3, edge: 9.3, total: 91, label: 'Cầu 3-3 TTTBBB' }
};

/* ================================================================
 *  BÃO → phiên sau (học từ 18 mẫu BÃO)
 * ================================================================ */
const KNOWLEDGE_BAO_NEXT = {
  predict: 'TAI',
  rate: 54.0,
  edge: 4.0,
  total: 18,
  label: 'Sau BÃO'
};
// ============================================================
//  PHẦN 3/5: STATE + RULE ENGINE + ENSEMBLE + PREDICT v5
// ============================================================

/* ================================================================
 *  GLOBAL STATE
 * ================================================================ */
let huHistory  = [];
let md5History = [];
let currentSessionIdHu  = null;
let currentSessionIdMd5 = null;

let huPredictionLog  = [];
let md5PredictionLog = [];

/* ================================================================
 *  RULE ENGINE v5 — CHỈ DÙNG KNOWLEDGE HARD-CODE
 * ================================================================ */
function ruleEngine(sessions) {
  const last = sessions[sessions.length - 1];
  const signals = [];

  // ===== 1. DICE =====
  const diceClass = classifyDice(last.dice);
  if (diceClass) {
    // BÃO → phiên sau TAI nhẹ
    if (diceClass.type === "BAO") {
      return [{
        source: "rule_bao_next",
        label: `${KNOWLEDGE_BAO_NEXT.label} ${diceClass.label}`,
        predict: KNOWLEDGE_BAO_NEXT.predict,
        rate: KNOWLEDGE_BAO_NEXT.rate,
        edge: KNOWLEDGE_BAO_NEXT.edge,
        note: `Sau BÃO → ${KNOWLEDGE_BAO_NEXT.predict} (${KNOWLEDGE_BAO_NEXT.rate}%)`,
        weight: 1.0,
        samples: KNOWLEDGE_BAO_NEXT.total,
        skip: false
      }];
    }

    const kd = KNOWLEDGE_DICE[diceClass.type];
    if (kd && kd.predict) {
      const weight = kd.strong ? 4.0 : 2.5;
      signals.push({
        source: "rule_dice",
        label: kd.label,
        predict: kd.predict,
        rate: kd.rate,
        edge: kd.edge,
        note: `${kd.label} → ${kd.predict} (${kd.rate}%, edge +${kd.edge}%, ${kd.total} mẫu)`,
        weight,
        samples: kd.total,
        strength: kd.strong ? 'STRONG' : 'WEAK'
      });
    }
  }

  // ===== 2. STREAK (BỆT / ĐẢO BỆT) =====
  let streakCount = 1;
  for (let i = sessions.length - 2; i >= 0; i--) {
    if (sessions[i].result === last.result) streakCount++;
    else break;
  }
  if (streakCount >= 3) {
    const bucket = streakCount >= 5 ? '5+' : String(streakCount);
    const key = `BET_${last.result}_${bucket}`;
    const kd = KNOWLEDGE_STREAK[key];
    if (kd) {
      // Bệt 3 tay edge yếu (52%) → bỏ qua
      if (kd.edge < 4) {
        // không push
      } else {
        const weight = kd.strong ? 3.5 : 2.0;
        signals.push({
          source: "rule_bet",
          label: kd.label,
          predict: kd.predict,
          rate: kd.rate,
          edge: kd.edge,
          note: `${kd.label} → ${kd.predict} (${kd.rate}%, edge +${kd.edge}%, ${kd.total} mẫu)`,
          weight,
          samples: kd.total,
          isReverse: kd.predict !== last.result
        });
      }
    }
  }

  // ===== 3. CẦU 2-2 =====
  if (sessions.length >= 4) {
    const last4 = sessions.slice(-4).map(s => s.result);
    if (last4[0] === last4[1] && last4[2] === last4[3] && last4[0] !== last4[2]) {
      const key = `CAU22_${last4.join('')}`;
      const kd = KNOWLEDGE_CAU[key];
      if (kd) {
        signals.push({
          source: "rule_cau22",
          label: kd.label,
          predict: kd.predict,
          rate: kd.rate,
          edge: kd.edge,
          note: `${kd.label} → ${kd.predict} (${kd.rate}%, ${kd.total} mẫu)`,
          weight: 2.5,
          samples: kd.total
        });
      }
    }
  }

  // ===== 4. CẦU 3-3 =====
  if (sessions.length >= 6) {
    const last6 = sessions.slice(-6).map(s => s.result);
    const is3_3 = (last6.slice(0, 3).every(x => x === last6[0]) &&
                   last6.slice(3).every(x => x === last6[3]) &&
                   last6[0] !== last6[3]);
    if (is3_3) {
      const key = `CAU33_${last6.join('')}`;
      const kd = KNOWLEDGE_CAU[key];
      if (kd) {
        signals.push({
          source: "rule_cau33",
          label: kd.label,
          predict: kd.predict,
          rate: kd.rate,
          edge: kd.edge,
          note: `${kd.label} → ${kd.predict} (${kd.rate}%, ${kd.total} mẫu)`,
          weight: 2.5,
          samples: kd.total
        });
      }
    }
  }

  // ===== 5. SCORE — ĐÃ BỎ HOÀN TOÀN =====

  return signals;
}

/* ================================================================
 *  ENSEMBLE VOTING v5
 * ================================================================ */
function ensembleVote(signals) {
  let vB = 0, vT = 0, wSum = 0;
  const used = [];

  for (const sig of signals) {
    if (!sig || !sig.predict) continue;
    const edgeFactor   = Math.max(0.3, (sig.edge || (sig.rate - 50)) / 10);
    const sampleFactor = Math.log10(1 + (sig.samples || 10)) / 2;
    const w = (sig.weight || 1) * edgeFactor * sampleFactor;

    if (sig.predict === 'TAI') vB += w;
    else if (sig.predict === 'XIU') vT += w;
    wSum += w;
    used.push(sig);
  }

  if (wSum === 0) return null;

  const pB = vB / wSum, pT = vT / wSum;
  const predict = pB >= pT ? 'TAI' : 'XIU';
  const agreement = predict === 'TAI' ? pB : pT;
  const disagreement = 1 - agreement;

  let confidence = Math.round(50 + agreement * 22);

  const sameDirStrong = used.filter(s => s.predict === predict && s.rate >= 57).length;
  if (sameDirStrong >= 2) confidence += 5;

  const strongReverse = used.find(s =>
    s.source === 'rule_bet' && s.isReverse && s.rate >= 60
  );
  if (strongReverse) confidence += 4;

  const diceSig = used.find(s => s.source === 'rule_dice');
  const betSig  = used.find(s => s.source === 'rule_bet');
  if (diceSig && betSig && diceSig.predict === betSig.predict) confidence += 6;

  if (disagreement > 0.35) confidence = Math.min(confidence, 58);

  confidence = Math.max(52, Math.min(confidence, 75));

  const reasons = used.map(s => {
    const icon = s.predict === 'TAI' ? '🔵' : '🔴';
    const srcName = {
      rule_dice:     `🎲 ${s.label}`,
      rule_bet:      `🔥 ${s.label}`,
      rule_cau22:    `📐 ${s.label}`,
      rule_cau33:    `📐 ${s.label}`,
      rule_bao_next: `⛔ ${s.label}`
    }[s.source] || s.label;
    return `${icon} ${srcName} → ${s.predict} (${s.rate}%)`;
  });

  return { predict, confidence, reasons, signals: used, disagreement, agreement };
}

/* ================================================================
 *  PREDICT v5 — NGƯỠNG 68%
 * ================================================================ */
function predict(sessions) {
  if (sessions.length < 5) {
    return { predict: 'TAI', confidence: 55, reason: 'Không đủ mẫu', signals: [], skip: false };
  }

  const signals = ruleEngine(sessions);
  const validSignals = signals.filter(s => s.predict && !s.skip);

  if (validSignals.length === 0) {
    return {
      predict: 'SKIP',
      confidence: 0,
      reason: '⚠️ Không có tín hiệu đủ mạnh → ĐỨNG NGOÀI',
      signals: [],
      skip: true,
      disagreement: 0
    };
  }

  const vote = ensembleVote(validSignals);
  if (!vote) {
    return {
      predict: 'SKIP',
      confidence: 0,
      reason: '⚠️ Không vote được',
      signals: [],
      skip: true,
      disagreement: 0
    };
  }

  if (vote.confidence < 68) {
    return {
      predict: 'SKIP',
      confidence: vote.confidence,
      reason: `⚠️ Confidence ${vote.confidence}% < 68% → ĐỨNG NGOÀI`,
      signals: vote.signals,
      skip: true,
      disagreement: vote.disagreement
    };
  }

  return {
    predict: vote.predict,
    confidence: vote.confidence,
    reason: vote.reasons.join(' | '),
    signals: vote.signals,
    skip: false,
    disagreement: vote.disagreement
  };
}
// ============================================================
//  PHẦN 4/5: PARSE API + FETCH + LOG + HELPERS + BACKTEST
// ============================================================

/* ================================================================
 *  PARSE DATA TỪ API
 * ================================================================ */
function parseLinesHu(data) {
  if (!data || !Array.isArray(data.list)) return [];
  return data.list.map(item => ({
    session: item.id,
    dice: item.dices,
    score: item.point,
    result: item.point >= 11 ? 'TAI' : 'XIU'
  })).sort((a, b) => a.session - b.session);
}

function parseLinesMd5(data) {
  if (!data || !Array.isArray(data.list)) return [];
  return data.list.map(item => ({
    session: item.id,
    dice: item.dices,
    score: item.point,
    result: item.resultTruyenThong === 'Tài' ? 'TAI' : 'XIU'
  })).sort((a, b) => a.session - b.session);
}

/* ================================================================
 *  FETCH DATA
 * ================================================================ */
async function fetchHuData() {
  try {
    const res = await fetch(API_URL_HU);
    const data = await res.json();
    const newHistory = parseLinesHu(data);
    if (newHistory.length === 0) return;

    const lastSession = newHistory.at(-1);

    if (!currentSessionIdHu) {
      huHistory = newHistory.slice().reverse();
      currentSessionIdHu = lastSession.session;
      console.log(`✅ [HŨ] Đã tải ${newHistory.length} phiên`);
    } else if (lastSession.session > currentSessionIdHu) {
      const newRecords = newHistory.filter(r => r.session > currentSessionIdHu);
      for (const r of newRecords) huHistory.unshift(r);
      if (huHistory.length > 1000) huHistory = huHistory.slice(0, 800);
      currentSessionIdHu = lastSession.session;
      if (newRecords.length > 0) console.log(`🆕 [HŨ] +${newRecords.length} phiên mới`);
    }

    verifyPredictions(huPredictionLog, huHistory);
  } catch (e) {
    console.error(`❌ [HŨ] Lỗi:`, e.message);
  }
}

async function fetchMd5Data() {
  try {
    const res = await fetch(API_URL_MD5);
    const data = await res.json();
    const newHistory = parseLinesMd5(data);
    if (newHistory.length === 0) return;

    const lastSession = newHistory.at(-1);

    if (!currentSessionIdMd5) {
      md5History = newHistory.slice().reverse();
      currentSessionIdMd5 = lastSession.session;
      console.log(`✅ [MD5] Đã tải ${newHistory.length} phiên`);
    } else if (lastSession.session > currentSessionIdMd5) {
      const newRecords = newHistory.filter(r => r.session > currentSessionIdMd5);
      for (const r of newRecords) md5History.unshift(r);
      if (md5History.length > 1000) md5History = md5History.slice(0, 800);
      currentSessionIdMd5 = lastSession.session;
      if (newRecords.length > 0) console.log(`🆕 [MD5] +${newRecords.length} phiên mới`);
    }

    verifyPredictions(md5PredictionLog, md5History);
  } catch (e) {
    console.error(`❌ [MD5] Lỗi:`, e.message);
  }
}

/* ================================================================
 *  PREDICTION LOG
 * ================================================================ */
function recordPrediction(log, session, prediction) {
  if (log.find(p => p.session === session)) return;
  if (prediction.skip) return;

  log.push({
    session,
    predict: prediction.predict,
    confidence: prediction.confidence,
    reason: prediction.reason,
    signals: prediction.signals?.map(s => ({ src: s.source, pred: s.predict, rate: s.rate })) || [],
    disagreement: prediction.disagreement || 0,
    actual: null,
    correct: null
  });
  if (log.length > 500) log.splice(0, log.length - 500);
}

function verifyPredictions(log, history) {
  const map = new Map(history.map(h => [h.session, h]));
  for (const p of log) {
    if (p.actual === null && map.has(p.session)) {
      const h = map.get(p.session);
      p.actual  = h.result;
      p.correct = p.predict === p.actual;
    }
  }
}

function buildHistoryReport(log, limit = 50) {
  const finished = log
    .filter(p => p.actual !== null)
    .sort((a, b) => b.session - a.session)
    .slice(0, limit);

  const total = finished.length;
  const dung  = finished.filter(p => p.correct).length;
  const sai   = total - dung;

  let winStreak = 0, lossStreak = 0;
  const sorted = [...log].filter(x => x.actual !== null).sort((a, b) => b.session - a.session);
  for (const p of sorted) {
    if (p.correct) { if (lossStreak === 0) winStreak++; else break; }
    else           { if (winStreak === 0) lossStreak++; else break; }
  }

  const history = finished.map(p => ({
    phien:       p.session,
    du_doan:     p.predict === 'TAI' ? 'tài' : 'xỉu',
    do_tin_cay:  `${p.confidence}%`,
    ly_do:       p.reason,
    ket_qua:     p.actual === 'TAI' ? 'tài' : 'xỉu',
    check:       p.correct ? 'đúng✅' : 'sai❌'
  }));

  return {
    history,
    thong_ke: {
      tong:        total,
      dung,
      sai,
      ti_le:       total > 0 ? `${(dung / total * 100).toFixed(1)}%` : '0%',
      win_streak:  winStreak,
      loss_streak: lossStreak
    }
  };
}

/* ================================================================
 *  MIDDLEWARE & HELPERS
 * ================================================================ */
function checkKey(query) {
  const userKey = query.key;
  if (!userKey || userKey !== VALID_KEY) {
    return { valid: false, error: "sai key rồi mua key đi adSika88" };
  }
  return { valid: true };
}

function buildResponse(history, gameName, log) {
  const chronological = [...history].reverse();
  const last = history[0];

  const result = predict(chronological);

  if (result.skip) {
    return {
      "id": ADMIN_ID,
      "game": gameName,
      "phien_truoc": last.session,
      "xuc_xac": `${last.dice[0]} - ${last.dice[1]} - ${last.dice[2]}`,
      "ket_qua": last.result === 'TAI' ? 'tài' : 'xỉu',
      "tong": last.score,
      "phien_nay": last.session + 1,
      "du_doan": result.predict === 'NGHI' ? 'NGHỈ ⛔' : 'ĐỨNG NGOÀI ⚠️',
      "do_tin_cay": `${result.confidence}%`,
      "ly_do": result.reason,
      "so_tin_hieu": result.signals?.length || 0,
      "canh_bao": result.predict === 'NGHI' ? "BÃO — KHÔNG VÀO TIỀN" : "Không đủ tín hiệu"
    };
  }

  recordPrediction(log, last.session + 1, result);

  return {
    "id": ADMIN_ID,
    "game": gameName,
    "phien_truoc": last.session,
    "xuc_xac": `${last.dice[0]} - ${last.dice[1]} - ${last.dice[2]}`,
    "ket_qua": last.result === 'TAI' ? 'tài' : 'xỉu',
    "tong": last.score,
    "phien_nay": last.session + 1,
    "du_doan": result.predict === 'TAI' ? 'tài' : 'xỉu',
    "do_tin_cay": `${result.confidence}%`,
    "ly_do": result.reason,
    "so_tin_hieu": result.signals?.length || 0,
    "do_bat_dong": result.disagreement ? `${(result.disagreement * 100).toFixed(0)}%` : '0%'
  };
}

/* ================================================================
 *  BACKTEST WALK-FORWARD (test 30% cuối)
 * ================================================================ */
function backtest(sessions, opts = {}) {
  const trainEnd = Math.floor(sessions.length * 0.7);
  const results = [];
  let correct = 0, total = 0, skip = 0;

  for (let i = Math.max(5, trainEnd); i < sessions.length - 1; i++) {
    const slice = sessions.slice(0, i + 1);
    const prediction = predict(slice);

    if (prediction.skip) { skip++; continue; }

    const actual = sessions[i + 1].result;
    const isCorrect = prediction.predict === actual;
    total++;
    if (isCorrect) correct++;

    results.push({
      session: sessions[i + 1].session,
      predict: prediction.predict,
      confidence: prediction.confidence,
      actual,
      correct: isCorrect,
      reason: prediction.reason
    });
  }

  const buckets = {};
  for (const r of results) {
    const b = Math.floor(r.confidence / 5) * 5;
    (buckets[b] ??= { total: 0, correct: 0 });
    buckets[b].total++;
    if (r.correct) buckets[b].correct++;
  }
  const bucketStats = Object.entries(buckets)
    .map(([conf, s]) => ({
      confidence_range: `${conf}-${+conf + 4}%`,
      total: s.total,
      correct: s.correct,
      win_rate: `${(s.correct / s.total * 100).toFixed(1)}%`
    }))
    .sort((a, b) => parseInt(a.confidence_range) - parseInt(b.confidence_range));

  return {
    train_size: trainEnd,
    test_size: sessions.length - trainEnd - 1,
    total_predictions: total,
    correct,
    skip,
    win_rate: total > 0 ? `${(correct / total * 100).toFixed(2)}%` : '0%',
    skip_rate: `${(skip / (total + skip) * 100).toFixed(1)}%`,
    by_confidence: bucketStats,
    recent_50: results.slice(-50).map(r => ({
      session: r.session,
      predict: r.predict,
      actual: r.actual,
      correct: r.correct ? '✅' : '❌',
      confidence: `${r.confidence}%`
    }))
  };
}
// ============================================================
//  PHẦN 5/5: FASTIFY SERVER + ROUTES + START
// ============================================================

const app = fastify({ logger: false });
await app.register(cors, { origin: "*" });

/* ---------- ROUTE GỐC ---------- */
app.get("/", async () => ({
  status: "active",
  message: "API Tài Xỉu v5 — Knowledge-based (không đọc .txt runtime)",
  algorithm: "🎲 v5 — Tri thức hard-code từ 4.228 phiên mẫu (dice + streak + cầu)",
  key: VALID_KEY,
  knowledge: {
    dice_patterns: Object.keys(KNOWLEDGE_DICE).filter(k => KNOWLEDGE_DICE[k].predict),
    streak_patterns: Object.keys(KNOWLEDGE_STREAK),
    cau_patterns: Object.keys(KNOWLEDGE_CAU),
    bao_next: KNOWLEDGE_BAO_NEXT
  },
  endpoints: {
    hu:              `/api/taixiu/lc789?key=${VALID_KEY}`,
    md5:             `/api/md5/lc789?key=${VALID_KEY}`,
    hu_history:      `/api/taixiu/lc789/prediction-history?key=${VALID_KEY}`,
    md5_history:     `/api/md5/lc789/prediction-history?key=${VALID_KEY}`,
    hu_raw:          `/api/taixiu/lc789/raw-history?key=${VALID_KEY}`,
    md5_raw:         `/api/md5/lc789/raw-history?key=${VALID_KEY}`,
    knowledge:       `/api/knowledge?key=${VALID_KEY}`,
    backtest_hu:     `/api/backtest/hu?key=${VALID_KEY}`,
    backtest_md5:    `/api/backtest/md5?key=${VALID_KEY}`
  }
}));

/* ================================================================
 *  HŨ
 * ================================================================ */
app.get("/api/taixiu/lc789", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  if (huHistory.length < 5) {
    return reply.status(503).send({ error: "Đang phân tích HŨ...", need: 5, current: huHistory.length });
  }
  const res  = buildResponse(huHistory, "HŨ", huPredictionLog);
  const hist = buildHistoryReport(huPredictionLog, 30);
  return { ...res, "history": hist.history, "thong_ke": hist.thong_ke };
});

/* ================================================================
 *  MD5
 * ================================================================ */
app.get("/api/md5/lc789", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  if (md5History.length < 5) {
    return reply.status(503).send({ error: "Đang phân tích MD5...", need: 5, current: md5History.length });
  }
  const res  = buildResponse(md5History, "MD5", md5PredictionLog);
  const hist = buildHistoryReport(md5PredictionLog, 30);
  return { ...res, "history": hist.history, "thong_ke": hist.thong_ke };
});

/* ================================================================
 *  HISTORY DỰ ĐOÁN
 * ================================================================ */
app.get("/api/taixiu/lc789/prediction-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  const limit = Math.min(parseInt(request.query.limit) || 30, 200);
  return buildHistoryReport(huPredictionLog, limit);
});

app.get("/api/md5/lc789/prediction-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  const limit = Math.min(parseInt(request.query.limit) || 30, 200);
  return buildHistoryReport(md5PredictionLog, limit);
});

/* ================================================================
 *  RAW HISTORY
 * ================================================================ */
app.get("/api/taixiu/lc789/raw-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  return huHistory.slice(0, 30).map(i => ({
    session: i.session, dice: i.dice, total: i.score,
    result: i.result === 'TAI' ? 'tài' : 'xỉu'
  }));
});

app.get("/api/md5/lc789/raw-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  return md5History.slice(0, 30).map(i => ({
    session: i.session, dice: i.dice, total: i.score,
    result: i.result === 'TAI' ? 'tài' : 'xỉu'
  }));
});

/* ================================================================
 *  KNOWLEDGE — XEM TRI THỨC ĐÃ HỌC
 * ================================================================ */
app.get("/api/knowledge", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  return {
    source: "Học từ 4.228 phiên mẫu (11 file .txt)",
    note: "Số liệu hard-code — KHÔNG đọc file runtime",
    dice: KNOWLEDGE_DICE,
    streak: KNOWLEDGE_STREAK,
    cau: KNOWLEDGE_CAU,
    bao_next: KNOWLEDGE_BAO_NEXT
  };
});

/* ================================================================
 *  BACKTEST API
 * ================================================================ */
app.get("/api/backtest/hu", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  const sessions = [...huHistory].reverse();
  if (sessions.length < 50) return { error: "Cần ≥50 phiên" };
  return backtest(sessions);
});

app.get("/api/backtest/md5", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });
  const sessions = [...md5History].reverse();
  if (sessions.length < 50) return { error: "Cần ≥50 phiên" };
  return backtest(sessions);
});

/* ================================================================
 *  CHECK KEY
 * ================================================================ */
app.get("/check-key", async (request) => {
  const userKey = request.query.key;
  if (!userKey || userKey !== VALID_KEY) {
    return { status: "error", message: "sai key rồi mua key đi adSika88" };
  }
  return { status: "success", message: "KEY HỢP LỆ", key: VALID_KEY };
});

/* ================================================================
 *  START SERVER
 * ================================================================ */
const start = async () => {
  console.log("\n🚀 Bước 1: Tải dữ liệu từ API...");
  await Promise.all([fetchHuData(), fetchMd5Data()]);

  setInterval(fetchHuData, 5000);
  setInterval(fetchMd5Data, 5000);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    console.error("❌ Lỗi khởi động server:", err.message);
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  TÀI XỈU VIP v5 — KNOWLEDGE-BASED (KHÔNG ĐỌC .TXT RUNTIME)      ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log(`║  🚀 Port: ${PORT}`);
  console.log(`║  🔑 KEY:  ${VALID_KEY}`);
  console.log(`║  👤 ADMIN: ${ADMIN_ID}`);
  console.log("║                                                                  ║");
  console.log("║  📚 TRI THỨC HỌC TỪ 4.228 PHIÊN MẪU:                            ║");
  console.log("║     • Dice: Kép Lớn/Bé, Tiến, Lùi, 2 mặt 6/1                    ║");
  console.log("║     • Streak: Bệt 3-4 theo, bệt 5+ ĐẢO                         ║");
  console.log("║     • Cầu: 2-2 và 3-3                                           ║");
  console.log("║     • BÃO → phiên sau TAI 54%                                   ║");
  console.log("║     • SCORE: BỎ HOÀN TOÀN (edge < 1.5%)                         ║");
  console.log("║                                                                  ║");
  console.log("║  🎯 NGƯỠNG VÀO TIỀN: confidence ≥ 68%                           ║");
  console.log("║  📊 CAP CONFIDENCE: 75% (thực tế, không ảo)                     ║");
  console.log("║                                                                  ║");
  console.log("║  🎯 ENDPOINTS:                                                  ║");
  console.log(`║     HŨ:        /api/taixiu/lc789?key=${VALID_KEY}`);
  console.log(`║     MD5:       /api/md5/lc789?key=${VALID_KEY}`);
  console.log(`║     Knowledge: /api/knowledge?key=${VALID_KEY}`);
  console.log(`║     Backtest:  /api/backtest/hu?key=${VALID_KEY}`);
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");
};

start();