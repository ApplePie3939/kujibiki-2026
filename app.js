const defaults = [
  { id: 'A', name: 'ポテト・から揚げ無料券', initial: 3, weight: 3, remaining: 3, wins: 0 },
  { id: 'B', name: 'ポテト増量券', initial: 10, weight: 12, remaining: 10, wins: 0 },
  { id: 'C', name: 'から揚げ増量券', initial: 20, weight: 25, remaining: 20, wins: 0 },
  { id: 'D', name: '参加賞', initial: 200, weight: 60, remaining: 200, wins: 0 },
];

const ADMIN_PASSCODE = '2026';
const $ = (id) => document.getElementById(id);

let prizes = load();
let isDrawing = false;

function load() {
  try {
    const data = JSON.parse(localStorage.getItem('festivalLottery'));
    return Array.isArray(data) && data.length === 4 ? data : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}

function save() {
  localStorage.setItem('festivalLottery', JSON.stringify(prizes));
}

function show(id) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.remove('active');
  });
  $(id).classList.add('active');
  $('adminButton').disabled = id === 'admin';
}

function renderStock() {
  $('stockBoard').innerHTML = prizes
    .filter((prize) => ['A', 'B'].includes(prize.id) && prize.remaining > 0)
    .map((prize) => `
      <div class="stock ${prize.id.toLowerCase()}">
        <span class="stock-label">${prize.id}賞 残り</span>
        <span class="stock-count">${prize.remaining}<small> 個</small></span>
      </div>
    `)
    .join('');
}

function renderAdmin() {
  $('settingsRows').innerHTML = prizes
    .map((prize) => `
      <tr>
        <td><b>${prize.id}賞</b></td>
        <td><input data-id="${prize.id}" data-field="name" value="${escapeHtml(prize.name)}"></td>
        <td><input data-id="${prize.id}" data-field="initial" type="number" min="0" value="${prize.initial}"></td>
        <td><input data-id="${prize.id}" data-field="weight" type="number" min="0" max="100" value="${prize.weight}"></td>
        <td>${prize.remaining}</td>
        <td>${prize.wins}</td>
      </tr>
    `)
    .join('');
}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

function setAdminStatus(message, isError = false) {
  $('adminStatus').textContent = message;
  $('adminStatus').classList.toggle('is-error', isError);
}

function pickPrize() {
  const available = prizes.filter((prize) => prize.remaining > 0 && prize.weight > 0);
  if (!available.length) return null;

  const total = available.reduce((sum, prize) => sum + prize.weight, 0);
  let roll = Math.random() * total;

  return available.find((prize) => (roll -= prize.weight) < 0) || available.at(-1);
}

function draw() {
  if (isDrawing) return;

  const picked = pickPrize();
  if (!picked) {
    alert('すべての賞の在庫がありません。管理画面で在庫を設定してください。');
    return;
  }

  isDrawing = true;
  show('drawing');

  setTimeout(() => {
    picked.remaining--;
    picked.wins++;
    save();
    presentResult(picked);
    isDrawing = false;
  }, 2200);
}

function presentResult(prize) {
  $('resultPrize').textContent = `${prize.id}賞`;
  $('resultName').textContent = prize.name;
  $('resultLabel').textContent = prize.id === 'A' ? '＼ 大当たり！！ ／' : 'おめでとう！';
  $('result').classList.toggle('a-prize', prize.id === 'A');
  $('confetti').innerHTML = prize.id === 'A'
    ? Array.from({ length: 45 }, (_, index) => (
      `<i style="left:${(index * 17) % 100}%;background:hsl(${index * 37},90%,55%);animation-delay:-${(index % 10) / 4}s"></i>`
    )).join('')
    : '';
  show('result');
}

function unlockAdmin() {
  const passcode = $('passcodeInput').value;

  if (passcode === ADMIN_PASSCODE) {
    $('passcodeDialog').hidden = true;
    renderAdmin();
    setAdminStatus('');
    show('admin');
    return;
  }

  $('passcodeError').textContent = 'パスコードが正しくありません。';
  $('passcodeInput').select();
}

function saveSettings() {
  const inputs = [...document.querySelectorAll('#settingsRows input')];
  const totalWeight = inputs
    .filter((input) => input.dataset.field === 'weight')
    .reduce((sum, input) => sum + Math.max(0, Number(input.value) || 0), 0);

  if (totalWeight > 100) {
    setAdminStatus(`確率（重み）の合計は100以下にしてください（現在: ${totalWeight}）。`, true);
    return;
  }

  inputs.forEach((input) => {
    const prize = prizes.find((item) => item.id === input.dataset.id);
    const value = input.dataset.field === 'name'
      ? input.value.trim()
      : Math.max(0, Number(input.value) || 0);

    prize[input.dataset.field] = value;
  });

  save();
  renderAdmin();
  setAdminStatus('設定を保存しました。初期在庫は次回リセット時に反映されます。');
}

function resetDay() {
  prizes.forEach((prize) => {
    prize.remaining = prize.initial;
    prize.wins = 0;
  });

  save();
  $('confirmDialog').hidden = true;
  renderAdmin();
  setAdminStatus('在庫と当選数を初期状態に戻しました。');
}

$('startButton').addEventListener('click', draw);
$('returnButton').addEventListener('click', () => {
  renderStock();
  show('standby');
});

$('adminButton').addEventListener('click', () => {
  $('passcodeInput').value = '';
  $('passcodeError').textContent = '';
  $('passcodeDialog').hidden = false;
  setTimeout(() => $('passcodeInput').focus(), 0);
});
$('cancelPasscode').addEventListener('click', () => {
  $('passcodeDialog').hidden = true;
});
$('submitPasscode').addEventListener('click', unlockAdmin);
$('passcodeInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') unlockAdmin();
});

$('closeAdmin').addEventListener('click', () => {
  renderStock();
  show('standby');
});
$('saveSettings').addEventListener('click', saveSettings);

$('resetDay').addEventListener('click', () => {
  $('confirmDialog').hidden = false;
});
$('cancelReset').addEventListener('click', () => {
  $('confirmDialog').hidden = true;
});
$('confirmReset').addEventListener('click', resetDay);

renderStock();
