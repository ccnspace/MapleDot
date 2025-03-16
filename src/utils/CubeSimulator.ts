import { fail } from "assert";

type ItemGrade = "레어" | "에픽" | "유니크" | "레전드리";

type Constructor = {
  itemGrade: ItemGrade;
  itemType: string;
  itemLevel: number;
  itemOptions: string[];
};

export class CubeSimulator {
  private grades: ItemGrade[];
  private gradeUpInfo: { chance: number; guarantee: number }[];
  private gradeIndex = 0;
  private failedAttempts = [0, 0, 0];

  private currentAttempt = 0;
  private currentGuarantee = 0;

  private currentOptions = ["", "", ""];
  private prevOptions = ["", "", ""];

  private currentGrade: ItemGrade = "레어";
  private prevGrade: ItemGrade = "레어";

  private initialItemGrade: ItemGrade;
  private initialItemOptions = ["", "", ""];
  private itemType = "";
  private itemLevel = "0";

  constructor({ itemGrade, itemOptions, itemType, itemLevel }: Constructor) {
    this.grades = ["레어", "에픽", "유니크", "레전드리"];
    this.gradeUpInfo = [
      { chance: 0.150000001275, guarantee: 10 }, // 레어 -> 에픽
      { chance: 0.035, guarantee: 42 }, // 에픽 -> 유니크
      { chance: 0.014, guarantee: 107 }, // 유니크 -> 레전드리
    ];
    this.initialItemGrade = itemGrade;
    this.itemType = itemType;
    this.itemLevel = this.convertItemLevelToString(itemLevel);
    this.initialItemOptions = itemOptions;

    this.reset(this.initialItemGrade, this.initialItemOptions);
  }

  convertItemLevelToString(itemLevel: number) {
    if (itemLevel < 30) return "30";
    if (itemLevel < 70) return "70";
    if (itemLevel < 119) return "100";
    if (itemLevel < 250) return "120";
    return "250";
  }

  reset(itemGrade: ItemGrade, itemOptions: string[]) {
    this.gradeIndex = this.grades.indexOf(itemGrade);
    this.failedAttempts = [0, 0, 0]; // 각 등급별 실패 횟수
    this.prevOptions = itemOptions ?? ["", "", ""]; // 옵션 초기화
    this.currentOptions = itemOptions ?? ["", "", ""]; // 옵션 초기화
    this.currentGuarantee = this.gradeUpInfo[this.gradeIndex]?.guarantee ?? 0;
  }

  rollCube() {
    this.prevGrade = this.grades[this.gradeIndex];
    if (this.gradeIndex < this.grades.length - 1) {
      const gradeUpInfo = this.gradeUpInfo[this.gradeIndex];
      const roll = Math.random();

      if (roll < gradeUpInfo.chance || this.failedAttempts[this.gradeIndex] >= gradeUpInfo.guarantee) {
        this.gradeIndex++;
        this.failedAttempts[this.gradeIndex - 1] = 0; // 보장된 승급 시 초기화
      } else {
        this.failedAttempts[this.gradeIndex]++;
      }
    }
    this.currentGrade = this.grades[this.gradeIndex];
    this.currentAttempt = this.failedAttempts[this.gradeIndex] ?? 0;
    this.currentGuarantee = this.gradeUpInfo[this.gradeIndex]?.guarantee ?? 0;
    this.assignOptions();
  }

  assignOptions() {
    this.prevOptions = this.currentOptions;

    const optionPool = this.getOptionPool();
    this.currentOptions = [
      this.getRandomOption(optionPool.firstLine),
      this.getRandomOption(optionPool.secondLine),
      this.getRandomOption(optionPool.thirdLine),
    ];
  }

  getOptionPool() {
    return getItemOptionPool(this.itemType, this.grades[this.gradeIndex], this.itemLevel);
  }

  getRandomOption(optionPool: Option[]) {
    const roll = Math.random();
    let cumulativeProbability = 0;

    for (const option of optionPool) {
      cumulativeProbability += option.probability;
      if (roll < cumulativeProbability) {
        return option.name;
      }
    }
    return "";
  }

  getItemState() {
    return {
      prevGrade: this.prevGrade,
      currentGrade: this.currentGrade,
      prevOptions: this.prevOptions,
      currentOptions: this.currentOptions,
      failedAttempts: this.failedAttempts,
      currentAttempt: this.currentAttempt,
      currentGuarantee: this.currentGuarantee,
    };
  }
}

type Option = { name: string; probability: number };
type ItemOptions = { firstLine: Option[]; secondLine: Option[]; thirdLine: Option[] };

function getItemOptionPool(itemType: string, itemGrade: ItemGrade, itemLevel: string): ItemOptions {
  // 특정 아이템 타입과 레벨에 따라 옵션 풀을 결정
  const optionPools: Record<string, Record<string, Record<string, ItemOptions>>> = {
    무기: {
      레어: {
        "120": {
          firstLine: [
            { name: "STR: +12", probability: 0.061224 },
            { name: "DEX: +12", probability: 0.061224 },
            { name: "INT: +12", probability: 0.061224 },
            { name: "LUK: +12", probability: 0.061224 },
            { name: "최대 HP: +120", probability: 0.061224 },
            { name: "최대 MP: +120", probability: 0.061224 },
            { name: "공격력: +12", probability: 0.040816 },
            { name: "마력: +12", probability: 0.040816 },
            { name: "STR: +3%", probability: 0.061224 },
            { name: "DEX: +3%", probability: 0.061224 },
            { name: "INT: +3%", probability: 0.061224 },
            { name: "LUK: +3%", probability: 0.061224 },
            { name: "공격력: +3%", probability: 0.020408 },
            { name: "마력: +3%", probability: 0.020408 },
            { name: "크리티컬 확률: +4%", probability: 0.020408 },
            { name: "데미지: +3%", probability: 0.020408 },
            { name: "올스탯: +5", probability: 0.040816 },
            { name: "공격 시 20% 확률로 240의 HP 회복", probability: 0.020408 },
            { name: "공격 시 20% 확률로 120의 MP 회복", probability: 0.020408 },
            { name: "공격 시 20% 확률로 6레벨 중독효과 적용", probability: 0.020408 },
            { name: "공격 시 10% 확률로 2레벨 기절효과 적용", probability: 0.020408 },
            { name: "공격 시 20% 확률로 2레벨 슬로우효과 적용", probability: 0.020408 },
            { name: "공격 시 20% 확률로 3레벨 암흑효과 적용", probability: 0.020408 },
            { name: "공격 시 10% 확률로 2레벨 빙결효과 적용", probability: 0.020408 },
            { name: "공격 시 10% 확률로 2레벨 봉인효과 적용", probability: 0.020408 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.020408 },
          ],
          secondLine: [
            { name: "STR: +6", probability: 0.109091 },
            { name: "DEX: +6", probability: 0.109091 },
            { name: "INT: +6", probability: 0.109091 },
            { name: "LUK: +6", probability: 0.109091 },
            { name: "최대 HP: +60", probability: 0.109091 },
            { name: "최대 MP: +60", probability: 0.109091 },
            { name: "공격력: +6", probability: 0.072727 },
            { name: "마력: +6", probability: 0.072727 },
            { name: "STR: +12", probability: 0.012245 },
            { name: "DEX: +12", probability: 0.012245 },
            { name: "INT: +12", probability: 0.012245 },
            { name: "LUK: +12", probability: 0.012245 },
            { name: "최대 HP: +120", probability: 0.012245 },
            { name: "최대 MP: +120", probability: 0.012245 },
            { name: "공격력: +12", probability: 0.008163 },
            { name: "마력: +12", probability: 0.008163 },
            { name: "STR: +3%", probability: 0.012245 },
            { name: "DEX: +3%", probability: 0.012245 },
            { name: "INT: +3%", probability: 0.012245 },
            { name: "LUK: +3%", probability: 0.012245 },
            { name: "공격력: +3%", probability: 0.004082 },
            { name: "마력: +3%", probability: 0.004082 },
            { name: "크리티컬 확률: +4%", probability: 0.004082 },
            { name: "데미지: +3%", probability: 0.004082 },
            { name: "올스탯: +5", probability: 0.008163 },
            { name: "공격 시 20% 확률로 240의 HP 회복", probability: 0.004082 },
            { name: "공격 시 20% 확률로 120의 MP 회복", probability: 0.004082 },
            { name: "공격 시 20% 확률로 6레벨 중독효과 적용", probability: 0.004082 },
            { name: "공격 시 10% 확률로 2레벨 기절효과 적용", probability: 0.004082 },
            { name: "공격 시 20% 확률로 2레벨 슬로우효과 적용", probability: 0.004082 },
            { name: "공격 시 20% 확률로 3레벨 암흑효과 적용", probability: 0.004082 },
            { name: "공격 시 10% 확률로 2레벨 빙결효과 적용", probability: 0.004082 },
            { name: "공격 시 10% 확률로 2레벨 봉인효과 적용", probability: 0.004082 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.004082 },
          ],
          thirdLine: [
            { name: "STR: +6", probability: 0.129545 },
            { name: "DEX: +6", probability: 0.129545 },
            { name: "INT: +6", probability: 0.129545 },
            { name: "LUK: +6", probability: 0.129545 },
            { name: "최대 HP: +60", probability: 0.129545 },
            { name: "최대 MP: +60", probability: 0.129545 },
            { name: "공격력: +6", probability: 0.086364 },
            { name: "마력: +6", probability: 0.086364 },
            { name: "STR: +12", probability: 0.003061 },
            { name: "DEX: +12", probability: 0.003061 },
            { name: "INT: +12", probability: 0.003061 },
            { name: "LUK: +12", probability: 0.003061 },
            { name: "최대 HP: +120", probability: 0.003061 },
            { name: "최대 MP: +120", probability: 0.003061 },
            { name: "공격력: +12", probability: 0.002041 },
            { name: "마력: +12", probability: 0.002041 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.00102 },
          ],
        },
      },
      에픽: {
        "120": {
          firstLine: [
            { name: "STR: +6%", probability: 0.108696 },
            { name: "DEX: +6%", probability: 0.108696 },
            { name: "INT: +6%", probability: 0.108696 },
            { name: "LUK: +6%", probability: 0.108696 },
            { name: "최대 HP: +6%", probability: 0.108696 },
            { name: "최대 MP: +6%", probability: 0.108696 },
            { name: "공격력: +6%", probability: 0.043478 },
            { name: "마력: +6%", probability: 0.043478 },
            { name: "크리티컬 확률: +8%", probability: 0.043478 },
            { name: "데미지: +6%", probability: 0.043478 },
            { name: "올스탯: +3%", probability: 0.043478 },
            { name: "공격 시 20% 확률로 360의 HP 회복", probability: 0.043478 },
            { name: "공격 시 20% 확률로 180의 MP 회복", probability: 0.043478 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.043478 },
          ],
          secondLine: [
            { name: "STR: +12", probability: 0.04898 },
            { name: "DEX: +12", probability: 0.04898 },
            { name: "INT: +12", probability: 0.04898 },
            { name: "LUK: +12", probability: 0.04898 },
            { name: "최대 HP: +120", probability: 0.04898 },
            { name: "최대 MP: +120", probability: 0.04898 },
            { name: "공격력: +12", probability: 0.032653 },
            { name: "마력: +12", probability: 0.032653 },
            { name: "STR: +3%", probability: 0.04898 },
            { name: "DEX: +3%", probability: 0.04898 },
            { name: "INT: +3%", probability: 0.04898 },
            { name: "LUK: +3%", probability: 0.04898 },
            { name: "공격력: +3%", probability: 0.016327 },
            { name: "마력: +3%", probability: 0.016327 },
            { name: "크리티컬 확률: +4%", probability: 0.016327 },
            { name: "데미지: +3%", probability: 0.016327 },
            { name: "올스탯: +5", probability: 0.032653 },
            { name: "공격 시 20% 확률로 240의 HP 회복", probability: 0.016327 },
            { name: "공격 시 20% 확률로 120의 MP 회복", probability: 0.016327 },
            { name: "공격 시 20% 확률로 6레벨 중독효과 적용", probability: 0.016327 },
            { name: "공격 시 10% 확률로 2레벨 기절효과 적용", probability: 0.016327 },
            { name: "공격 시 20% 확률로 2레벨 슬로우효과 적용", probability: 0.016327 },
            { name: "공격 시 20% 확률로 3레벨 암흑효과 적용", probability: 0.016327 },
            { name: "공격 시 10% 확률로 2레벨 빙결효과 적용", probability: 0.016327 },
            { name: "공격 시 10% 확률로 2레벨 봉인효과 적용", probability: 0.016327 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.016327 },
            { name: "STR: +6%", probability: 0.021739 },
            { name: "DEX: +6%", probability: 0.021739 },
            { name: "INT: +6%", probability: 0.021739 },
            { name: "LUK: +6%", probability: 0.021739 },
            { name: "최대 HP: +6%", probability: 0.021739 },
            { name: "최대 MP: +6%", probability: 0.021739 },
            { name: "공격력: +6%", probability: 0.008696 },
            { name: "마력: +6%", probability: 0.008696 },
            { name: "크리티컬 확률: +8%", probability: 0.008696 },
            { name: "데미지: +6%", probability: 0.008696 },
            { name: "올스탯: +3%", probability: 0.008696 },
            { name: "공격 시 20% 확률로 360의 HP 회복", probability: 0.008696 },
            { name: "공격 시 20% 확률로 180의 MP 회복", probability: 0.008696 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.008696 },
          ],
          thirdLine: [
            { name: "STR: +12", probability: 0.058163 },
            { name: "DEX: +12", probability: 0.058163 },
            { name: "INT: +12", probability: 0.058163 },
            { name: "LUK: +12", probability: 0.058163 },
            { name: "최대 HP: +120", probability: 0.058163 },
            { name: "최대 MP: +120", probability: 0.058163 },
            { name: "공격력: +12", probability: 0.038776 },
            { name: "마력: +12", probability: 0.038776 },
            { name: "STR: +3%", probability: 0.058163 },
            { name: "DEX: +3%", probability: 0.058163 },
            { name: "INT: +3%", probability: 0.058163 },
            { name: "LUK: +3%", probability: 0.058163 },
            { name: "공격력: +3%", probability: 0.019388 },
            { name: "마력: +3%", probability: 0.019388 },
            { name: "크리티컬 확률: +4%", probability: 0.019388 },
            { name: "데미지: +3%", probability: 0.019388 },
            { name: "올스탯: +5", probability: 0.038776 },
            { name: "공격 시 20% 확률로 240의 HP 회복", probability: 0.019388 },
            { name: "공격 시 20% 확률로 120의 MP 회복", probability: 0.019388 },
            { name: "공격 시 20% 확률로 6레벨 중독효과 적용", probability: 0.019388 },
            { name: "공격 시 10% 확률로 2레벨 기절효과 적용", probability: 0.019388 },
            { name: "공격 시 20% 확률로 2레벨 슬로우효과 적용", probability: 0.019388 },
            { name: "공격 시 20% 확률로 3레벨 암흑효과 적용", probability: 0.019388 },
            { name: "공격 시 10% 확률로 2레벨 빙결효과 적용", probability: 0.019388 },
            { name: "공격 시 10% 확률로 2레벨 봉인효과 적용", probability: 0.019388 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.019388 },
            { name: "STR: +6%", probability: 0.005435 },
            { name: "DEX: +6%", probability: 0.005435 },
            { name: "INT: +6%", probability: 0.005435 },
            { name: "LUK: +6%", probability: 0.005435 },
            { name: "최대 HP: +6%", probability: 0.005435 },
            { name: "최대 MP: +6%", probability: 0.005435 },
            { name: "공격력: +6%", probability: 0.002174 },
            { name: "마력: +6%", probability: 0.002174 },
            { name: "크리티컬 확률: +8%", probability: 0.002174 },
            { name: "데미지: +6%", probability: 0.002174 },
            { name: "올스탯: +3%", probability: 0.002174 },
            { name: "공격 시 20% 확률로 360의 HP 회복", probability: 0.002174 },
            { name: "공격 시 20% 확률로 180의 MP 회복", probability: 0.002174 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.002174 },
          ],
        },
      },
      유니크: {
        "120": {
          firstLine: [
            { name: "STR: +9%", probability: 0.116279 },
            { name: "DEX: +9%", probability: 0.116279 },
            { name: "INT: +9%", probability: 0.116279 },
            { name: "LUK: +9%", probability: 0.116279 },
            { name: "공격력: +9%", probability: 0.069767 },
            { name: "마력: +9%", probability: 0.069767 },
            { name: "크리티컬 확률: +9%", probability: 0.093023 },
            { name: "데미지: +9%", probability: 0.069767 },
            { name: "올스탯: +6%", probability: 0.093023 },
            { name: "몬스터 방어율 무시: +30%", probability: 0.069767 },
            { name: "보스 몬스터 공격 시 데미지: +30%", probability: 0.069767 },
          ],
          secondLine: [
            { name: "STR: +6%", probability: 0.086957 },
            { name: "DEX: +6%", probability: 0.086957 },
            { name: "INT: +6%", probability: 0.086957 },
            { name: "LUK: +6%", probability: 0.086957 },
            { name: "최대 HP: +6%", probability: 0.086957 },
            { name: "최대 MP: +6%", probability: 0.086957 },
            { name: "공격력: +6%", probability: 0.034783 },
            { name: "마력: +6%", probability: 0.034783 },
            { name: "크리티컬 확률: +8%", probability: 0.034783 },
            { name: "데미지: +6%", probability: 0.034783 },
            { name: "올스탯: +3%", probability: 0.034783 },
            { name: "공격 시 20% 확률로 360의 HP 회복", probability: 0.034783 },
            { name: "공격 시 20% 확률로 180의 MP 회복", probability: 0.034783 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.034783 },
            { name: "STR: +9%", probability: 0.023256 },
            { name: "DEX: +9%", probability: 0.023256 },
            { name: "INT: +9%", probability: 0.023256 },
            { name: "LUK: +9%", probability: 0.023256 },
            { name: "공격력: +9%", probability: 0.013953 },
            { name: "마력: +9%", probability: 0.013953 },
            { name: "크리티컬 확률: +9%", probability: 0.018605 },
            { name: "데미지: +9%", probability: 0.013953 },
            { name: "올스탯: +6%", probability: 0.018605 },
            { name: "몬스터 방어율 무시: +30%", probability: 0.013953 },
            { name: "보스 몬스터 공격 시 데미지: +30%", probability: 0.013953 },
          ],
          thirdLine: [
            { name: "STR: +6%", probability: 0.103261 },
            { name: "DEX: +6%", probability: 0.103261 },
            { name: "INT: +6%", probability: 0.103261 },
            { name: "LUK: +6%", probability: 0.103261 },
            { name: "최대 HP: +6%", probability: 0.103261 },
            { name: "최대 MP: +6%", probability: 0.103261 },
            { name: "공격력: +6%", probability: 0.041304 },
            { name: "마력: +6%", probability: 0.041304 },
            { name: "크리티컬 확률: +8%", probability: 0.041304 },
            { name: "데미지: +6%", probability: 0.041304 },
            { name: "올스탯: +3%", probability: 0.041304 },
            { name: "공격 시 20% 확률로 360의 HP 회복", probability: 0.041304 },
            { name: "공격 시 20% 확률로 180의 MP 회복", probability: 0.041304 },
            { name: "몬스터 방어율 무시: +15%", probability: 0.041304 },
            { name: "STR: +9%", probability: 0.005814 },
            { name: "DEX: +9%", probability: 0.005814 },
            { name: "INT: +9%", probability: 0.005814 },
            { name: "LUK: +9%", probability: 0.005814 },
            { name: "공격력: +9%", probability: 0.003488 },
            { name: "마력: +9%", probability: 0.003488 },
            { name: "크리티컬 확률: +9%", probability: 0.004651 },
            { name: "데미지: +9%", probability: 0.003488 },
            { name: "올스탯: +6%", probability: 0.004651 },
            { name: "몬스터 방어율 무시: +30%", probability: 0.003488 },
            { name: "보스 몬스터 공격 시 데미지: +30%", probability: 0.003488 },
          ],
        },
      },
      레전드리: {
        "120": {
          firstLine: [
            { name: "STR: +12%", probability: 0.097561 },
            { name: "DEX: +12%", probability: 0.097561 },
            { name: "INT: +12%", probability: 0.097561 },
            { name: "LUK: +12%", probability: 0.097561 },
            { name: "공격력: +12%", probability: 0.04878 },
            { name: "마력: +12%", probability: 0.04878 },
            { name: "크리티컬 확률: +12%", probability: 0.04878 },
            { name: "데미지: +12%", probability: 0.04878 },
            { name: "올스탯: +9%", probability: 0.073171 },
            { name: "공격력: +32", probability: 0.04878 },
            { name: "마력: +32", probability: 0.04878 },
            { name: "몬스터 방어율 무시: +35%", probability: 0.04878 },
            { name: "몬스터 방어율 무시: +40%", probability: 0.04878 },
            { name: "보스 몬스터 공격 시 데미지: +35%", probability: 0.097561 },
            { name: "보스 몬스터 공격 시 데미지: +40%", probability: 0.04878 },
          ],
          secondLine: [
            { name: "STR: +9%", probability: 0.093023 },
            { name: "DEX: +9%", probability: 0.093023 },
            { name: "INT: +9%", probability: 0.093023 },
            { name: "LUK: +9%", probability: 0.093023 },
            { name: "공격력: +9%", probability: 0.055814 },
            { name: "마력: +9%", probability: 0.055814 },
            { name: "크리티컬 확률: +9%", probability: 0.074419 },
            { name: "데미지: +9%", probability: 0.055814 },
            { name: "올스탯: +6%", probability: 0.074419 },
            { name: "몬스터 방어율 무시: +30%", probability: 0.055814 },
            { name: "보스 몬스터 공격 시 데미지: +30%", probability: 0.055814 },
            { name: "STR: +12%", probability: 0.019512 },
            { name: "DEX: +12%", probability: 0.019512 },
            { name: "INT: +12%", probability: 0.019512 },
            { name: "LUK: +12%", probability: 0.019512 },
            { name: "공격력: +12%", probability: 0.009756 },
            { name: "마력: +12%", probability: 0.009756 },
            { name: "크리티컬 확률: +12%", probability: 0.009756 },
            { name: "데미지: +12%", probability: 0.009756 },
            { name: "올스탯: +9%", probability: 0.014634 },
            { name: "공격력: +32", probability: 0.009756 },
            { name: "마력: +32", probability: 0.009756 },
            { name: "몬스터 방어율 무시: +35%", probability: 0.009756 },
            { name: "몬스터 방어율 무시: +40%", probability: 0.009756 },
            { name: "보스 몬스터 공격 시 데미지: +35%", probability: 0.019512 },
            { name: "보스 몬스터 공격 시 데미지: +40%", probability: 0.009756 },
          ],
          thirdLine: [
            { name: "STR: +9%", probability: 0.110465 },
            { name: "DEX: +9%", probability: 0.110465 },
            { name: "INT: +9%", probability: 0.110465 },
            { name: "LUK: +9%", probability: 0.110465 },
            { name: "공격력: +9%", probability: 0.066279 },
            { name: "마력: +9%", probability: 0.066279 },
            { name: "크리티컬 확률: +9%", probability: 0.088372 },
            { name: "데미지: +9%", probability: 0.066279 },
            { name: "올스탯: +6%", probability: 0.088372 },
            { name: "몬스터 방어율 무시: +30%", probability: 0.066279 },
            { name: "보스 몬스터 공격 시 데미지: +30%", probability: 0.066279 },
            { name: "STR: +12%", probability: 0.004878 },
            { name: "DEX: +12%", probability: 0.004878 },
            { name: "INT: +12%", probability: 0.004878 },
            { name: "LUK: +12%", probability: 0.004878 },
            { name: "공격력: +12%", probability: 0.002439 },
            { name: "마력: +12%", probability: 0.002439 },
            { name: "크리티컬 확률: +12%", probability: 0.002439 },
            { name: "데미지: +12%", probability: 0.002439 },
            { name: "올스탯: +9%", probability: 0.003659 },
            { name: "공격력: +32", probability: 0.002439 },
            { name: "마력: +32", probability: 0.002439 },
            { name: "몬스터 방어율 무시: +35%", probability: 0.002439 },
            { name: "몬스터 방어율 무시: +40%", probability: 0.002439 },
            { name: "보스 몬스터 공격 시 데미지: +35%", probability: 0.004878 },
            { name: "보스 몬스터 공격 시 데미지: +40%", probability: 0.002439 },
          ],
        },
      },
    },
  };

  return optionPools[itemType][itemGrade][itemLevel] || { firstLine: [], secondLine: [], thirdLine: [] };
}
