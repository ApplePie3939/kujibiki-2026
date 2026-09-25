const defaults = [
  { id: 'A', name: 'ポテト・から揚げ無料券', initial: 3, weight: 3, remaining: 3, wins: 0 },
  { id: 'B', name: 'ポテト増量券', initial: 10, weight: 12, remaining: 10, wins: 0 },
  { id: 'C', name: 'から揚げ増量券', initial: 20, weight: 25, remaining: 20, wins: 0 },
  { id: 'D', name: '参加賞', initial: 200, weight: 60, remaining: 200, wins: 0 }
];
const ADMIN_PASSCODE = '2026';
let prizes = load();
let isDrawing = false;
const $ = (id) => document.getElementById(id);

function load() { try { const data = JSON.parse(localStorage.getItem('festivalLottery')); return Array.isArray(data) && data.length === 4 ? data : structuredClone(defaults); } catch { return structuredClone(defaults); } }
function save() { localStorage.setItem('festivalLottery', JSON.stringify(prizes)); }
function show(id) { document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active')); $(id).classList.add('active'); }
function renderStock() { $('stockBoard').innerHTML = prizes.filter((p) => ['A','B'].includes(p.id) && p.remaining > 0).map((p) => `<div class="stock ${p.id.toLowerCase()}"><span class="stock-label">${p.id}賞 残り</span><span class="stock-count">${p.remaining}<small> 個</small></span></div>`).join(''); }
function renderAdmin() { $('settingsRows').innerHTML = prizes.map((p) => `<tr><td><b>${p.id}賞</b></td><td><input data-id="${p.id}" data-field="name" value="${escapeHtml(p.name)}"></td><td><input data-id="${p.id}" data-field="initial" type="number" min="0" value="${p.initial}"></td><td><input data-id="${p.id}" data-field="weight" type="number" min="0" value="${p.weight}"></td><td>${p.remaining}</td><td>${p.wins}</td></tr>`).join(''); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]); }
function pickPrize() { const available = prizes.filter((p) => p.remaining > 0 && p.weight > 0); if (!available.length) return null; const total = available.reduce((sum,p) => sum + p.weight, 0); let roll = Math.random() * total; return available.find((p) => (roll -= p.weight) < 0) || available.at(-1); }
function draw() { if (isDrawing) return; const picked = pickPrize(); if (!picked) { alert('すべての賞の在庫がありません。管理画面で在庫を設定してください。'); return; } isDrawing = true; show('drawing'); setTimeout(() => { picked.remaining--; picked.wins++; save(); presentResult(picked); isDrawing = false; }, 2200); }
function presentResult(prize) { $('resultPrize').textContent = `${prize.id}賞`; $('resultName').textContent = prize.name; $('resultLabel').textContent = prize.id === 'A' ? '＼ 大当たり！！ ／' : 'おめでとう！'; $('result').classList.toggle('a-prize', prize.id === 'A'); $('confetti').innerHTML = prize.id === 'A' ? Array.from({length:45}, (_,i) => `<i style="left:${(i*17)%100}%;background:hsl(${i*37},90%,55%);animation-delay:-${(i%10)/4}s"></i>`).join('') : ''; show('result'); }
$('startButton').addEventListener('click', draw);
$('returnButton').addEventListener('click', () => { renderStock(); show('standby'); });
$('adminButton').addEventListener('click', () => { $('passcodeInput').value = ''; $('passcodeError').textContent = ''; $('passcodeDialog').hidden = false; setTimeout(() => $('passcodeInput').focus(), 0); });
$('cancelPasscode').addEventListener('click', () => { $('passcodeDialog').hidden = true; });
function unlockAdmin() { const passcode = $('passcodeInput').value; if (passcode === ADMIN_PASSCODE) { $('passcodeDialog').hidden = true; renderAdmin(); $('adminStatus').textContent = ''; show('admin'); } else { $('passcodeError').textContent = 'パスコードが正しくありません。'; $('passcodeInput').select(); } }
$('submitPasscode').addEventListener('click', unlockAdmin);
$('passcodeInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') unlockAdmin(); });
$('closeAdmin').addEventListener('click', () => { renderStock(); show('standby'); });
$('saveSettings').addEventListener('click', () => { document.querySelectorAll('#settingsRows input').forEach((input) => { const prize = prizes.find((p) => p.id === input.dataset.id); const value = input.dataset.field === 'name' ? input.value.trim() : Math.max(0, Number(input.value) || 0); prize[input.dataset.field] = value; }); save(); renderAdmin(); $('adminStatus').textContent = '設定を保存しました。初期在庫は次回リセット時に反映されます。'; });
$('resetDay').addEventListener('click', () => { $('confirmDialog').hidden = false; });
$('cancelReset').addEventListener('click', () => { $('confirmDialog').hidden = true; });
$('confirmReset').addEventListener('click', () => { prizes.forEach((p) => { p.remaining = p.initial; p.wins = 0; }); save(); $('confirmDialog').hidden = true; renderAdmin(); $('adminStatus').textContent = '在庫と当選数を初期状態に戻しました。'; });
renderStock();
