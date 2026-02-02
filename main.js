const meditationRateByStage = {
  0: 0,
  1: 0.024,
  2: 0.04,
  3: 0.06,
  4: 0.084,
  5: 0.112,
  6: 0.144,
  7: 0.18,
  8: 0.28,
  9: 0.462,
  10: 0.72,
};

const elementMultiplier = {
  "성일반(화수토풍)": 1.1 ** 2,
  "성암": 1.2 ** 2,
  "성성": 0.75 ** 2,
  "암일반(화수토풍)": 1.1 ** 2,
  "암암": 0.75 ** 2,
  "암성": 1.2 ** 2,
};

const attackElements = ["성", "암"];
const cursePresets = {
  none: { label: "없음", ac: 0, magicDefense: 0 },
  rento: { label: "렌토, 렌티아", ac: 20, magicDefense: 0 },
  bardo: { label: "바르도, 바르데아", ac: 35, magicDefense: -10 },
  defreco: { label: "데프레코, 데프레타", ac: 50, magicDefense: -20 },
  pravo: { label: "프라보, 프라베라", ac: 65, magicDefense: -30 },
  mark: { label: "어둠의각인", ac: 70, magicDefense: -30 },
  anathema: { label: "아나테마", ac: 75, magicDefense: -30 },
};

let skills = [
  {
    name: "홀리드래곤",
    coeff: 1.8,
    element: "성",
    mpCost: 12960,
  },
  {
    name: "메테오",
    coeff: 1.5,
    element: "암",
    mpCost: 12960,
  },
  {
    name: "라그나로크",
    coeff: 0.375,
    element: "암",
    mpCost: 0,
  },
];

const $ = (id) => document.getElementById(id);
const format = (num) => (Number.isFinite(num) ? Math.round(num).toLocaleString("ko-KR") : "-");
const numVal = (el, fallback = 0) => {
  const n = Number(el.value);
  return Number.isFinite(n) ? n : fallback;
};
const esc = (v) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const stateEls = {
  maxMana: $("maxMana"),
  meditationStage: $("meditationStage"),
  monsterElement: $("monsterElement"),
  monsterAc: $("monsterAc"),
  cursePreset: $("cursePreset"),
  extraDebuff: $("extraDebuff"),
  charDerived: $("charDerived"),
  monsterDerived: $("monsterDerived"),
  skillBody: $("skillBody"),
  addSkillBtn: $("addSkillBtn"),
  globalNaru: $("globalNaru"),
};

function getMultiplier(skillElement, monsterElement) {
  const key = `${skillElement}${monsterElement}`;
  return elementMultiplier[key] ?? 1;
}

function recalc() {
  const maxMana = numVal(stateEls.maxMana, 0);
  const stage = Math.min(10, Math.max(0, Math.floor(numVal(stateEls.meditationStage, 0))));
  if (String(stage) !== stateEls.meditationStage.value) stateEls.meditationStage.value = stage;

  const oneTickRecovery = maxMana * 0.2;
  const twoTickRecovery = maxMana * 0.4;
  const meditationRecovery = maxMana * (meditationRateByStage[stage] ?? 0);

  const ac = numVal(stateEls.monsterAc, 0);
  const selectedCurse = cursePresets[stateEls.cursePreset.value] ?? cursePresets.none;
  const curse = selectedCurse.ac;
  const magicDefenseFactor = (100 - selectedCurse.magicDefense) / 100;
  const extraDebuff = numVal(stateEls.extraDebuff, 0);
  const defenseTotal = ac + curse + extraDebuff;
  const defenseFactor = (100 + defenseTotal) / 100;
  const monsterElement = stateEls.monsterElement.value;
  const naruEnabled = stateEls.globalNaru.checked;

  stateEls.charDerived.textContent = `1틱 회복량: ${format(oneTickRecovery)} / 2틱 회복량: ${format(twoTickRecovery)} / 메디 회복량: ${format(meditationRecovery)}`;
  stateEls.monsterDerived.textContent = `저주: ${selectedCurse.label} / 방깎 합계: ${format(defenseTotal)} (계수 ${defenseFactor.toFixed(2)}) / 마법방어 계수: ${magicDefenseFactor.toFixed(2)}`;

  stateEls.skillBody.innerHTML = "";

  skills.forEach((skill, index) => {
    const multiplier = getMultiplier(skill.element, monsterElement);
    const oneTick =
      (oneTickRecovery + meditationRecovery - skill.mpCost) * skill.coeff * multiplier * defenseFactor * magicDefenseFactor;
    const maxDamage = (maxMana - skill.mpCost) * skill.coeff * multiplier * defenseFactor * magicDefenseFactor;
    const twoTickRaw =
      (twoTickRecovery + meditationRecovery - skill.mpCost) * skill.coeff * multiplier * defenseFactor * magicDefenseFactor;
    const twoTick = Math.min(twoTickRaw, maxDamage);
    const oneTickNaru = naruEnabled ? oneTick * 2 : null;
    const twoTickNaru = naruEnabled ? twoTick * 2 : null;
    const hotTime = maxDamage * 1.2;

    const row = document.createElement("tr");
    row.dataset.index = String(index);
    row.innerHTML = `
      <td><input class="cell-input" data-field="name" type="text" value="${esc(skill.name)}"></td>
      <td><input class="cell-input" data-field="coeff" type="number" step="0.001" value="${skill.coeff}"></td>
      <td>
        <select class="cell-input" data-field="element">
          ${attackElements
            .map((e) => `<option value="${e}" ${skill.element === e ? "selected" : ""}>${e}</option>`)
            .join("")}
        </select>
      </td>
      <td><input class="cell-input" data-field="mpCost" type="number" min="0" value="${skill.mpCost}"></td>
      <td>${format(oneTick)}</td>
      <td>${format(twoTick)}</td>
      <td>${oneTickNaru === null ? "-" : format(oneTickNaru)}</td>
      <td>${twoTickNaru === null ? "-" : format(twoTickNaru)}</td>
      <td>${format(maxDamage)}</td>
      <td>${format(hotTime)}</td>
    `;
    stateEls.skillBody.appendChild(row);

    const noteRow = document.createElement("tr");
    noteRow.dataset.index = String(index);
    noteRow.innerHTML = `
      <td colspan="10" class="skill-note">
        <div class="skill-meta skill-meta--stack">
          <div class="meta-row">
            <span class="meta-label">속성 배율</span>
            <span class="meta-value">${multiplier.toFixed(4)}</span>
            <button class="delete-btn" data-action="delete" type="button">삭제</button>
          </div>
        </div>
      </td>
    `;
    stateEls.skillBody.appendChild(noteRow);
  });
}

[
  stateEls.maxMana,
  stateEls.meditationStage,
  stateEls.monsterElement,
  stateEls.monsterAc,
  stateEls.cursePreset,
  stateEls.extraDebuff,
  stateEls.globalNaru,
].forEach((el) => el.addEventListener("input", recalc));

stateEls.skillBody.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const field = target.dataset.field;
  if (!field) return;
  const tr = target.closest("tr");
  const index = tr ? Number(tr.dataset.index) : NaN;
  if (!Number.isInteger(index) || !skills[index]) return;

  if (field === "name" && target instanceof HTMLInputElement) {
    skills[index].name = target.value;
  } else if (field === "element" && target instanceof HTMLSelectElement) {
    skills[index].element = target.value;
  } else if ((field === "coeff" || field === "mpCost") && target instanceof HTMLInputElement) {
    const n = Number(target.value);
    skills[index][field] = Number.isFinite(n) ? n : 0;
  }

  recalc();
});

stateEls.skillBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.action !== "delete") return;
  const tr = target.closest("tr");
  const index = tr ? Number(tr.dataset.index) : NaN;
  if (!Number.isInteger(index) || !skills[index]) return;
  skills.splice(index, 1);
  recalc();
});

stateEls.addSkillBtn.addEventListener("click", () => {
  skills.push({
    name: "새 스킬",
    coeff: 1,
    element: "성",
    mpCost: 0,
  });
  recalc();
});

recalc();
