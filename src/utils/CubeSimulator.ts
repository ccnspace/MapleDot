import { convertItemLevel } from "./convertItemLevel";

type ItemGrade = "레어" | "에픽" | "유니크" | "레전드리";
export type CubeType = "additional" | "potential";

type Constructor = {
  itemType: string; // 예: 무기, 엠블렘, ...
  itemLevel: number;
  initItemGrade: ItemGrade;
  initAdditionalGrade: ItemGrade;
  initItemOptions: string[];
  initAdditionalOptions: string[];
  cubeType: CubeType;
};

const adjustOptions = (lineOptions: Option[], optionName: string) => {
  const targetOptions = lineOptions.filter((option) => option.name.includes(optionName));

  const probSum = targetOptions.reduce((acc, cur) => {
    acc = acc + cur.probability;
    return acc;
  }, 0);

  const adjustedLineOptions = lineOptions
    .filter((option) => !option.name.includes(optionName))
    .map((option) => ({
      ...option,
      probability: option.probability / (1 - probSum),
    })) as Option[];

  return adjustedLineOptions;
};

export class CubeSimulator {
  private grades: ItemGrade[];
  private gradeUpInfo: { chance: number; guarantee: number }[];
  private gradeIndex = 0;
  private failedAttempts = [0, 0, 0, 0];
  private cubeType: CubeType = "potential";

  private currentAttempt = 0;
  private currentGuarantee = 0;

  // 전, 후 옵션 저장
  private currentOptions = ["", "", ""];
  private prevOptions = ["", "", ""];

  private currentGrade: ItemGrade = "레어";
  private prevGrade: ItemGrade = "레어";

  private initItemGrade: ItemGrade;
  private initAdditionalGrade: ItemGrade;

  private initItemOptions = ["", "", ""];
  private initAdditionalOptions = ["", "", ""];
  private itemType = "";
  private itemLevel = "0";

  constructor(params: Constructor) {
    const { initItemGrade, initItemOptions, initAdditionalGrade, initAdditionalOptions, itemType, itemLevel, cubeType } = params;
    this.grades = ["레어", "에픽", "유니크", "레전드리"];
    this.itemType = itemType;
    this.cubeType = cubeType;
    this.gradeUpInfo = this.getGradeUpInfo();
    this.itemLevel = convertItemLevel(itemLevel);
    this.initItemGrade = initItemGrade;
    this.initAdditionalGrade = initAdditionalGrade;
    this.initItemOptions = initItemOptions;
    this.initAdditionalOptions = initAdditionalOptions;

    this.init();
  }

  private init() {
    const itemGrade = this.cubeType === "potential" ? this.initItemGrade : this.initAdditionalGrade;
    const itemOptions = this.cubeType === "potential" ? this.initItemOptions : this.initAdditionalOptions;

    this.gradeIndex = this.grades.indexOf(itemGrade);
    this.failedAttempts = [0, 0, 0, 0]; // 각 등급별 시도도 횟수
    this.prevOptions = itemOptions ?? ["", "", ""]; // 옵션 초기화
    this.currentOptions = itemOptions ?? ["", "", ""]; // 옵션 초기화
    this.currentGuarantee = this.gradeUpInfo[this.gradeIndex]?.guarantee ?? 0;
  }

  private assignOptions() {
    const optionPool = this.getOptionPool();
    let secondOptionPool: Option[] = [];
    let thirdOptionPool: Option[] = [];

    let firstOption: string;
    let secondOption: string;
    let thirdOption: string;

    do {
      firstOption = this.getRandomOption(optionPool.firstLine);

      // 첫 번째 옵션에서 피격 후 무적시간/쓸만한 등장 시, 두-세번째 옵션에서는 나오지 않게 filter
      if (firstOption.includes("피격 후 무적시간")) {
        secondOptionPool = adjustOptions(optionPool.secondLine, "피격 후 무적시간");
        thirdOptionPool = adjustOptions(optionPool.thirdLine, "피격 후 무적시간");
      } else if (firstOption.includes("쓸만한")) {
        secondOptionPool = adjustOptions(optionPool.secondLine, "쓸만한");
        thirdOptionPool = adjustOptions(optionPool.thirdLine, "쓸만한");
      } else {
        secondOptionPool = optionPool.secondLine;
        thirdOptionPool = optionPool.thirdLine;
      }

      // 두 번째 옵션에서 피격 후 무적시간/쓸만한 등장 시, 세 번째 옵션에서는 나오지 않게 filter
      secondOption = this.getRandomOption(secondOptionPool);

      if (secondOption.includes("피격 후 무적시간")) {
        thirdOptionPool = adjustOptions(thirdOptionPool, "피격 후 무적시간");
      } else if (secondOption.includes("쓸만한")) {
        thirdOptionPool = adjustOptions(thirdOptionPool, "쓸만한");
      }

      // 첫, 두 번째 옵션에서 피격 시 일정 확률로 데미지 % 무시, 일정 확률로 몇 초간 무적 나오면 세 번째 옵션에서는 나오지 않게 filter
      const excludeOptions = ["확률로 데미지의", "초간 무적"];
      for (const option of excludeOptions) {
        if (firstOption.includes(option) || secondOption.includes(option)) {
          thirdOptionPool = adjustOptions(thirdOptionPool, option);
        }
      }

      thirdOption = this.getRandomOption(thirdOptionPool);
    } while (this.prevOptions[0] === firstOption && this.prevOptions[1] === secondOption && this.prevOptions[2] === thirdOption);

    this.currentOptions = [firstOption, secondOption, thirdOption];
  }

  private getOptionPool() {
    switch (this.cubeType) {
      case "potential":
        return getItemOptionPool(this.itemType, this.grades[this.gradeIndex], this.itemLevel);
      case "additional":
        return getAdditionalOptionPool(this.itemType, this.grades[this.gradeIndex], this.itemLevel);
      default:
        throw new Error("CubeType is invalid");
    }
  }

  private getRandomOption(optionPool: Option[]) {
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

  private getGradeUpInfo() {
    if (this.cubeType === "potential") {
      return [
        { chance: 0.150000001275, guarantee: 10 }, // 레어 -> 에픽
        { chance: 0.035, guarantee: 42 }, // 에픽 -> 유니크
        { chance: 0.014, guarantee: 107 }, // 유니크 -> 레전드리
      ];
    }
    // 에디셔널
    return [
      { chance: 0.02381, guarantee: 62 }, // 레어 -> 에픽
      { chance: 0.009804, guarantee: 152 }, // 에픽 -> 유니크
      { chance: 0.007, guarantee: 214 }, // 유니크 -> 레전드리
    ];
  }

  rollCube() {
    if (this.prevGrade !== this.currentGrade) {
      this.prevOptions = this.currentOptions;
    }
    this.prevGrade = this.grades[this.gradeIndex];
    const roll = Math.random();

    if (this.gradeIndex < this.grades.length - 1) {
      const gradeUpInfo = this.gradeUpInfo[this.gradeIndex];

      if (roll < gradeUpInfo.chance || this.failedAttempts[this.gradeIndex] >= gradeUpInfo.guarantee) {
        this.gradeIndex++;
        // this.failedAttempts[this.gradeIndex - 1] = 0; // 보장된 승급 시 초기화
      } else {
        this.failedAttempts[this.gradeIndex]++;
      }
    } else {
      this.failedAttempts[this.gradeIndex]++;
    }

    this.currentGrade = this.grades[this.gradeIndex];
    this.currentAttempt = this.failedAttempts[this.gradeIndex];
    this.currentGuarantee = this.gradeUpInfo[this.gradeIndex]?.guarantee ?? 0;

    this.assignOptions();
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

  setMiracleTime(isSet: boolean) {
    if (isSet) {
      const updatedGradeUpInfo = this.gradeUpInfo.map((item) => ({ ...item, chance: item.chance * 2 }));
      this.gradeUpInfo = updatedGradeUpInfo;
    } else {
      this.gradeUpInfo = this.getGradeUpInfo();
    }
  }

  setPrevOptions(options: string[]) {
    this.prevOptions = options;
  }

  setCurrentAttempt(attempt: number) {
    this.failedAttempts[this.gradeIndex] = attempt;
  }

  getCurrentGradeUpInfo() {
    return this.gradeUpInfo;
  }
}

type Option = { name: string; probability: number };
type ItemOptions = { firstLine: Option[]; secondLine: Option[]; thirdLine: Option[] };

export function getItemOptionPool(itemType: string, itemGrade: ItemGrade, itemLevel: string): ItemOptions {
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
    상의: {
      레어: {
        "120": {
          firstLine: [
            { name: "STR : +12", probability: 0.075 },
            { name: "DEX : +12", probability: 0.075 },
            { name: "INT : +12", probability: 0.075 },
            { name: "LUK : +12", probability: 0.075 },
            { name: "최대 HP : +120", probability: 0.075 },
            { name: "최대 MP : +120", probability: 0.075 },
            { name: "방어력 : +120", probability: 0.05 },
            { name: "STR : +3%", probability: 0.075 },
            { name: "DEX : +3%", probability: 0.075 },
            { name: "INT : +3%", probability: 0.075 },
            { name: "LUK : +3%", probability: 0.075 },
            { name: "최대 HP : +3%", probability: 0.05 },
            { name: "최대 MP : +3%", probability: 0.05 },
            { name: "방어력 : +3%", probability: 0.05 },
            { name: "올스탯 : +5", probability: 0.05 },
          ],
          secondLine: [
            { name: "STR : +6", probability: 0.114286 },
            { name: "DEX : +6", probability: 0.114286 },
            { name: "INT : +6", probability: 0.114286 },
            { name: "LUK : +6", probability: 0.114286 },
            { name: "최대 HP : +60", probability: 0.114286 },
            { name: "최대 MP : +60", probability: 0.114286 },
            { name: "방어력 : +60", probability: 0.114286 },
            { name: "STR : +12", probability: 0.015 },
            { name: "DEX : +12", probability: 0.015 },
            { name: "INT : +12", probability: 0.015 },
            { name: "LUK : +12", probability: 0.015 },
            { name: "최대 HP : +120", probability: 0.015 },
            { name: "최대 MP : +120", probability: 0.015 },
            { name: "방어력 : +120", probability: 0.010000001192 },
            { name: "STR : +3%", probability: 0.015 },
            { name: "DEX : +3%", probability: 0.015 },
            { name: "INT : +3%", probability: 0.015 },
            { name: "LUK : +3%", probability: 0.015 },
            { name: "최대 HP : +3%", probability: 0.010000001192 },
            { name: "최대 MP : +3%", probability: 0.010000001192 },
            { name: "방어력 : +3%", probability: 0.010000001192 },
            { name: "올스탯 : +5", probability: 0.010000001192 },
          ],
          thirdLine: [
            { name: "STR : +6", probability: 0.135714 },
            { name: "DEX : +6", probability: 0.135714 },
            { name: "INT : +6", probability: 0.135714 },
            { name: "LUK : +6", probability: 0.135714 },
            { name: "최대 HP : +60", probability: 0.135714 },
            { name: "최대 MP : +60", probability: 0.135714 },
            { name: "방어력 : +60", probability: 0.135714 },
            { name: "STR : +12", probability: 0.00375 },
            { name: "DEX : +12", probability: 0.00375 },
            { name: "INT : +12", probability: 0.00375 },
            { name: "LUK : +12", probability: 0.00375 },
            { name: "최대 HP : +120", probability: 0.00375 },
            { name: "최대 MP : +120", probability: 0.00375 },
            { name: "방어력 : +120", probability: 0.0025 },
            { name: "STR : +3%", probability: 0.00375 },
            { name: "DEX : +3%", probability: 0.00375 },
            { name: "INT : +3%", probability: 0.00375 },
            { name: "LUK : +3%", probability: 0.00375 },
            { name: "최대 HP : +3%", probability: 0.0025 },
            { name: "최대 MP : +3%", probability: 0.0025 },
            { name: "방어력 : +3%", probability: 0.0025 },
            { name: "올스탯 : +5", probability: 0.0025 },
          ],
        },
      },
      에픽: {
        "120": {
          firstLine: [
            { name: "STR : +6%", probability: 0.131579 },
            { name: "DEX : +6%", probability: 0.131579 },
            { name: "INT : +6%", probability: 0.131579 },
            { name: "LUK : +6%", probability: 0.131579 },
            { name: "최대 HP : +6%", probability: 0.131579 },
            { name: "최대 MP : +6%", probability: 0.131579 },
            { name: "방어력 : +6%", probability: 0.078947 },
            { name: "올스탯 : +3%", probability: 0.052632 },
            { name: "피격 후 무적시간 : +1초", probability: 0.078947 },
          ],
          secondLine: [
            { name: "STR : +12", probability: 0.06 },
            { name: "DEX : +12", probability: 0.06 },
            { name: "INT : +12", probability: 0.06 },
            { name: "LUK : +12", probability: 0.06 },
            { name: "최대 HP : +120", probability: 0.06 },
            { name: "최대 MP : +120", probability: 0.06 },
            { name: "방어력 : +120", probability: 0.040000004768 },
            { name: "STR : +3%", probability: 0.06 },
            { name: "DEX : +3%", probability: 0.06 },
            { name: "INT : +3%", probability: 0.06 },
            { name: "LUK : +3%", probability: 0.06 },
            { name: "최대 HP : +3%", probability: 0.040000004768 },
            { name: "최대 MP : +3%", probability: 0.040000004768 },
            { name: "방어력 : +3%", probability: 0.040000004768 },
            { name: "올스탯 : +5", probability: 0.040000004768 },
            { name: "STR : +6%", probability: 0.026316 },
            { name: "DEX : +6%", probability: 0.026316 },
            { name: "INT : +6%", probability: 0.026316 },
            { name: "LUK : +6%", probability: 0.026316 },
            { name: "최대 HP : +6%", probability: 0.026316 },
            { name: "최대 MP : +6%", probability: 0.026316 },
            { name: "방어력 : +6%", probability: 0.015789 },
            { name: "올스탯 : +3%", probability: 0.0105263 },
            { name: "피격 후 무적시간 : +1초", probability: 0.015789 },
          ],
          thirdLine: [
            { name: "STR : +12", probability: 0.07125 },
            { name: "DEX : +12", probability: 0.07125 },
            { name: "INT : +12", probability: 0.07125 },
            { name: "LUK : +12", probability: 0.07125 },
            { name: "최대 HP : +120", probability: 0.07125 },
            { name: "최대 MP : +120", probability: 0.07125 },
            { name: "방어력 : +120", probability: 0.0475 },
            { name: "STR : +3%", probability: 0.07125 },
            { name: "DEX : +3%", probability: 0.07125 },
            { name: "INT : +3%", probability: 0.07125 },
            { name: "LUK : +3%", probability: 0.07125 },
            { name: "최대 HP : +3%", probability: 0.0475 },
            { name: "최대 MP : +3%", probability: 0.0475 },
            { name: "방어력 : +3%", probability: 0.0475 },
            { name: "올스탯 : +5", probability: 0.0475 },
            { name: "STR : +6%", probability: 0.006579 },
            { name: "DEX : +6%", probability: 0.006579 },
            { name: "INT : +6%", probability: 0.006579 },
            { name: "LUK : +6%", probability: 0.006579 },
            { name: "최대 HP : +6%", probability: 0.006579 },
            { name: "최대 MP : +6%", probability: 0.006579 },
            { name: "방어력 : +6%", probability: 0.003947 },
            { name: "올스탯 : +3%", probability: 0.002632 },
            { name: "피격 후 무적시간 : +1초", probability: 0.003947 },
          ],
        },
      },
      유니크: {
        "120": {
          firstLine: [
            { name: "STR : +9%", probability: 0.0806452 },
            { name: "DEX : +9%", probability: 0.0806452 },
            { name: "INT : +9%", probability: 0.0806452 },
            { name: "LUK : +9%", probability: 0.0806452 },
            { name: "최대 HP : +9%", probability: 0.096774 },
            { name: "최대 MP : +9%", probability: 0.096774 },
            { name: "올스탯 : +6%", probability: 0.064516 },
            { name: "피격 시 5% 확률로 데미지의 20% 무시", probability: 0.064516 },
            { name: "피격 시 5% 확률로 데미지의 40% 무시", probability: 0.064516 },
            { name: "피격 후 무적시간 : +2초", probability: 0.064516 },
            { name: "피격 시 2% 확률로 7초간 무적", probability: 0.064516 },
            { name: "30% 확률로 받은 피해의 50%를 반사", probability: 0.064516 },
            { name: "30% 확률로 받은 피해의 70%를 반사", probability: 0.032258 },
            { name: "HP 회복 아이템 및 회복 스킬 효율 : +30%", probability: 0.064516 },
          ],
          secondLine: [
            { name: "STR : +6%", probability: 0.105263 },
            { name: "DEX : +6%", probability: 0.105263 },
            { name: "INT : +6%", probability: 0.105263 },
            { name: "LUK : +6%", probability: 0.105263 },
            { name: "최대 HP : +6%", probability: 0.105263 },
            { name: "최대 MP : +6%", probability: 0.105263 },
            { name: "방어력 : +6%", probability: 0.063158 },
            { name: "올스탯 : +3%", probability: 0.042105 },
            { name: "피격 후 무적시간 : +1초", probability: 0.063158 },
            { name: "STR : +9%", probability: 0.016129 },
            { name: "DEX : +9%", probability: 0.016129 },
            { name: "INT : +9%", probability: 0.016129 },
            { name: "LUK : +9%", probability: 0.016129 },
            { name: "최대 HP : +9%", probability: 0.019355 },
            { name: "최대 MP : +9%", probability: 0.019355 },
            { name: "올스탯 : +6%", probability: 0.012903 },
            { name: "피격 시 5% 확률로 데미지의 20% 무시", probability: 0.012903 },
            { name: "피격 시 5% 확률로 데미지의 40% 무시", probability: 0.012903 },
            { name: "피격 후 무적시간 : +2초", probability: 0.012903 },
            { name: "피격 시 2% 확률로 7초간 무적", probability: 0.012903 },
            { name: "30% 확률로 받은 피해의 50%를 반사", probability: 0.012903 },
            { name: "30% 확률로 받은 피해의 70%를 반사", probability: 0.006452 },
            { name: "HP 회복 아이템 및 회복 스킬 효율 : +30%", probability: 0.012903 },
          ],
          thirdLine: [
            { name: "STR : +6%", probability: 0.125 },
            { name: "DEX : +6%", probability: 0.125 },
            { name: "INT : +6%", probability: 0.125 },
            { name: "LUK : +6%", probability: 0.125 },
            { name: "최대 HP : +6%", probability: 0.125 },
            { name: "최대 MP : +6%", probability: 0.125 },
            { name: "방어력 : +6%", probability: 0.075 },
            { name: "올스탯 : +3%", probability: 0.05 },
            { name: "피격 후 무적시간 : +1초", probability: 0.075 },
            { name: "STR : +9%", probability: 0.004032 },
            { name: "DEX : +9%", probability: 0.004032 },
            { name: "INT : +9%", probability: 0.004032 },
            { name: "LUK : +9%", probability: 0.004032 },
            { name: "최대 HP : +9%", probability: 0.004839 },
            { name: "최대 MP : +9%", probability: 0.004839 },
            { name: "올스탯 : +6%", probability: 0.003226 },
            { name: "피격 시 5% 확률로 데미지의 20% 무시", probability: 0.003226 },
            { name: "피격 시 5% 확률로 데미지의 40% 무시", probability: 0.003226 },
            { name: "피격 후 무적시간 : +2초", probability: 0.003226 },
            { name: "피격 시 2% 확률로 7초간 무적", probability: 0.003226 },
            { name: "30% 확률로 받은 피해의 50%를 반사", probability: 0.003226 },
            { name: "30% 확률로 받은 피해의 70%를 반사", probability: 0.001613 },
            { name: "HP 회복 아이템 및 회복 스킬 효율 : +30%", probability: 0.003226 },
          ],
        },
      },
      레전드리: {
        "120": {
          firstLine: [
            { name: "STR : +12%", probability: 0.102564 },
            { name: "DEX : +12%", probability: 0.102564 },
            { name: "INT : +12%", probability: 0.102564 },
            { name: "LUK : +12%", probability: 0.102564 },
            { name: "최대 HP : +12%", probability: 0.102564 },
            { name: "최대 MP : +12%", probability: 0.102564 },
            { name: "올스탯 : +9%", probability: 0.076923 },
            { name: "피격 시 10% 확률로 데미지의 20% 무시", probability: 0.076923 },
            { name: "피격 시 10% 확률로 데미지의 40% 무시", probability: 0.076923 },
            { name: "피격 후 무적시간 : +3초", probability: 0.076923 },
            { name: "피격 시 4% 확률로 7초간 무적", probability: 0.076923 },
          ],
          secondLine: [
            { name: "STR : +9%", probability: 0.064516 },
            { name: "DEX : +9%", probability: 0.064516 },
            { name: "INT : +9%", probability: 0.064516 },
            { name: "LUK : +9%", probability: 0.064516 },
            { name: "최대 HP : +9%", probability: 0.077419 },
            { name: "최대 MP : +9%", probability: 0.077419 },
            { name: "올스탯 : +6%", probability: 0.051613 },
            { name: "피격 시 5% 확률로 데미지의 20% 무시", probability: 0.051613 },
            { name: "피격 시 5% 확률로 데미지의 40% 무시", probability: 0.051613 },
            { name: "피격 후 무적시간 : +2초", probability: 0.051613 },
            { name: "피격 시 2% 확률로 7초간 무적", probability: 0.051613 },
            { name: "30% 확률로 받은 피해의 50%를 반사", probability: 0.051613 },
            { name: "30% 확률로 받은 피해의 70%를 반사", probability: 0.025806 },
            { name: "HP 회복 아이템 및 회복 스킬 효율 : +30%", probability: 0.051613 },
            { name: "STR : +12%", probability: 0.0205128 },
            { name: "DEX : +12%", probability: 0.0205128 },
            { name: "INT : +12%", probability: 0.0205128 },
            { name: "LUK : +12%", probability: 0.0205128 },
            { name: "최대 HP : +12%", probability: 0.0205128 },
            { name: "최대 MP : +12%", probability: 0.0205128 },
            { name: "올스탯 : +9%", probability: 0.015385 },
            { name: "피격 시 10% 확률로 데미지의 20% 무시", probability: 0.015385 },
            { name: "피격 시 10% 확률로 데미지의 40% 무시", probability: 0.015385 },
            { name: "피격 후 무적시간 : +3초", probability: 0.015385 },
            { name: "피격 시 4% 확률로 7초간 무적", probability: 0.015385 },
          ],
          thirdLine: [
            { name: "STR : +9%", probability: 0.076613 },
            { name: "DEX : +9%", probability: 0.076613 },
            { name: "INT : +9%", probability: 0.076613 },
            { name: "LUK : +9%", probability: 0.076613 },
            { name: "최대 HP : +9%", probability: 0.091935 },
            { name: "최대 MP : +9%", probability: 0.091935 },
            { name: "올스탯 : +6%", probability: 0.06129 },
            { name: "피격 시 5% 확률로 데미지의 20% 무시", probability: 0.06129 },
            { name: "피격 시 5% 확률로 데미지의 40% 무시", probability: 0.06129 },
            { name: "피격 후 무적시간 : +2초", probability: 0.06129 },
            { name: "피격 시 2% 확률로 7초간 무적", probability: 0.06129 },
            { name: "30% 확률로 받은 피해의 50%를 반사", probability: 0.06129 },
            { name: "30% 확률로 받은 피해의 70%를 반사", probability: 0.0306452 },
            { name: "HP 회복 아이템 및 회복 스킬 효율 : +30%", probability: 0.06129 },
            { name: "STR : +12%", probability: 0.005128 },
            { name: "DEX : +12%", probability: 0.005128 },
            { name: "INT : +12%", probability: 0.005128 },
            { name: "LUK : +12%", probability: 0.005128 },
            { name: "최대 HP : +12%", probability: 0.005128 },
            { name: "최대 MP : +12%", probability: 0.005128 },
            { name: "올스탯 : +9%", probability: 0.003846 },
            { name: "피격 시 10% 확률로 데미지의 20% 무시", probability: 0.003846 },
            { name: "피격 시 10% 확률로 데미지의 40% 무시", probability: 0.003846 },
            { name: "피격 후 무적시간 : +3초", probability: 0.003846 },
            { name: "피격 시 4% 확률로 7초간 무적", probability: 0.003846 },
          ],
        },
      },
    },
  };

  return optionPools[itemType][itemGrade][itemLevel] || { firstLine: [], secondLine: [], thirdLine: [] };
}

export function getAdditionalOptionPool(itemType: string, itemGrade: ItemGrade, itemLevel: string): ItemOptions {
  // 특정 아이템 타입과 레벨에 따라 옵션 풀을 결정
  const optionPools: Record<string, Record<string, Record<string, ItemOptions>>> = {
    무기: {
      레어: {
        "120": {
          firstLine: [
            { name: "최대 HP : +100", probability: 0.058824 },
            { name: "최대 MP : +100", probability: 0.058824 },
            { name: "이동속도 : +6", probability: 0.058824 },
            { name: "점프력 : +6", probability: 0.058824 },
            { name: "방어력 : +100", probability: 0.058824 },
            { name: "STR : +12", probability: 0.058824 },
            { name: "DEX : +12", probability: 0.058824 },
            { name: "INT : +12", probability: 0.058824 },
            { name: "LUK : +12", probability: 0.058824 },
            { name: "공격력 : +12", probability: 0.039216 },
            { name: "마력 : +12", probability: 0.039216 },
            { name: "최대 HP : +2%", probability: 0.039216 },
            { name: "최대 MP : +2%", probability: 0.039216 },
            { name: "STR : +3%", probability: 0.039216 },
            { name: "DEX : +3%", probability: 0.039216 },
            { name: "INT : +3%", probability: 0.039216 },
            { name: "LUK : +3%", probability: 0.039216 },
            { name: "공격력 : +3%", probability: 0.019608 },
            { name: "마력 : +3%", probability: 0.019608 },
            { name: "크리티컬 확률 : +4%", probability: 0.039216 },
            { name: "데미지 : +3%", probability: 0.019608 },
            { name: "올스탯 : +5", probability: 0.058824 },
          ],
          secondLine: [
            { name: "STR : +6", probability: 0.072622 },
            { name: "DEX : +6", probability: 0.072622 },
            { name: "INT : +6", probability: 0.072622 },
            { name: "LUK : +6", probability: 0.072622 },
            { name: "최대 HP : +60", probability: 0.108932 },
            { name: "최대 MP : +60", probability: 0.108932 },
            { name: "이동속도 : +4", probability: 0.108932 },
            { name: "점프력 : +4", probability: 0.108932 },
            { name: "방어력 : +60", probability: 0.108932 },
            { name: "공격력 : +6", probability: 0.072622 },
            { name: "마력 : +6", probability: 0.072622 },
            { name: "최대 HP : +100", probability: 0.001153 },
            { name: "최대 MP : +100", probability: 0.001153 },
            { name: "이동속도 : +6", probability: 0.001153 },
            { name: "점프력 : +6", probability: 0.001153 },
            { name: "방어력 : +100", probability: 0.001153 },
            { name: "STR : +12", probability: 0.001153 },
            { name: "DEX : +12", probability: 0.001153 },
            { name: "INT : +12", probability: 0.001153 },
            { name: "LUK : +12", probability: 0.001153 },
            { name: "공격력 : +12", probability: 0.0007689 },
            { name: "마력 : +12", probability: 0.0007689 },
            { name: "최대 HP : +2%", probability: 0.0007689 },
            { name: "최대 MP : +2%", probability: 0.0007689 },
            { name: "STR : +3%", probability: 0.0007689 },
            { name: "DEX : +3%", probability: 0.0007689 },
            { name: "INT : +3%", probability: 0.0007689 },
            { name: "LUK : +3%", probability: 0.0007689 },
            { name: "공격력 : +3%", probability: 0.0003845 },
            { name: "마력 : +3%", probability: 0.0003845 },
            { name: "크리티컬 확률 : +4%", probability: 0.0007689 },
            { name: "데미지 : +3%", probability: 0.0003845 },
            { name: "올스탯 : +5", probability: 0.001153 },
          ],
          thirdLine: [
            { name: "STR : +6", probability: 0.072622 },
            { name: "DEX : +6", probability: 0.072622 },
            { name: "INT : +6", probability: 0.072622 },
            { name: "LUK : +6", probability: 0.072622 },
            { name: "최대 HP : +60", probability: 0.108932 },
            { name: "최대 MP : +60", probability: 0.108932 },
            { name: "이동속도 : +4", probability: 0.108932 },
            { name: "점프력 : +4", probability: 0.108932 },
            { name: "방어력 : +60", probability: 0.108932 },
            { name: "공격력 : +6", probability: 0.072622 },
            { name: "마력 : +6", probability: 0.072622 },
            { name: "최대 HP : +100", probability: 0.001153 },
            { name: "최대 MP : +100", probability: 0.001153 },
            { name: "이동속도 : +6", probability: 0.001153 },
            { name: "점프력 : +6", probability: 0.001153 },
            { name: "방어력 : +100", probability: 0.001153 },
            { name: "STR : +12", probability: 0.001153 },
            { name: "DEX : +12", probability: 0.001153 },
            { name: "INT : +12", probability: 0.001153 },
            { name: "LUK : +12", probability: 0.001153 },
            { name: "공격력 : +12", probability: 0.0007689 },
            { name: "마력 : +12", probability: 0.0007689 },
            { name: "최대 HP : +2%", probability: 0.0007689 },
            { name: "최대 MP : +2%", probability: 0.0007689 },
            { name: "STR : +3%", probability: 0.0007689 },
            { name: "DEX : +3%", probability: 0.0007689 },
            { name: "INT : +3%", probability: 0.0007689 },
            { name: "LUK : +3%", probability: 0.0007689 },
            { name: "공격력 : +3%", probability: 0.0003845 },
            { name: "마력 : +3%", probability: 0.0003845 },
            { name: "크리티컬 확률 : +4%", probability: 0.0007689 },
            { name: "데미지 : +3%", probability: 0.0003845 },
            { name: "올스탯 : +5", probability: 0.001153 },
          ],
        },
      },
      에픽: {
        "120": {
          firstLine: [
            { name: "최대 HP : +5%", probability: 0.088235 },
            { name: "최대 MP : +5%", probability: 0.088235 },
            { name: "공격력 : +6%", probability: 0.058824 },
            { name: "마력 : +6%", probability: 0.058824 },
            { name: "크리티컬 확률 : +6%", probability: 0.029412 },
            { name: "STR : +6%", probability: 0.088235 },
            { name: "DEX : +6%", probability: 0.088235 },
            { name: "INT : +6%", probability: 0.088235 },
            { name: "LUK : +6%", probability: 0.088235 },
            { name: "데미지 : +6%", probability: 0.029412 },
            { name: "올스탯 : +3%", probability: 0.058824 },
            { name: "공격 시 3% 확률로 53의 HP 회복", probability: 0.088235 },
            { name: "공격 시 3% 확률로 53의 MP 회복", probability: 0.088235 },
            { name: "몬스터 방어율 무시 : +3%", probability: 0.058824 },
          ],
          secondLine: [
            { name: "최대 HP : +100", probability: 0.056022 },
            { name: "최대 MP : +100", probability: 0.056022 },
            { name: "이동속도 : +6", probability: 0.056022 },
            { name: "점프력 : +6", probability: 0.056022 },
            { name: "방어력 : +100", probability: 0.056022 },
            { name: "STR : +12", probability: 0.056022 },
            { name: "DEX : +12", probability: 0.056022 },
            { name: "INT : +12", probability: 0.056022 },
            { name: "LUK : +12", probability: 0.056022 },
            { name: "공격력 : +12", probability: 0.037348 },
            { name: "마력 : +12", probability: 0.037348 },
            { name: "최대 HP : +2%", probability: 0.037348 },
            { name: "최대 MP : +2%", probability: 0.037348 },
            { name: "STR : +3%", probability: 0.037348 },
            { name: "DEX : +3%", probability: 0.037348 },
            { name: "INT : +3%", probability: 0.037348 },
            { name: "LUK : +3%", probability: 0.037348 },
            { name: "공격력 : +3%", probability: 0.018674 },
            { name: "마력 : +3%", probability: 0.018674 },
            { name: "크리티컬 확률 : +4%", probability: 0.037348 },
            { name: "데미지 : +3%", probability: 0.018674 },
            { name: "올스탯 : +5", probability: 0.056022 },
            { name: "최대 HP : +5%", probability: 0.004202 },
            { name: "최대 MP : +5%", probability: 0.004202 },
            { name: "공격력 : +6%", probability: 0.002801 },
            { name: "마력 : +6%", probability: 0.002801 },
            { name: "크리티컬 확률 : +6%", probability: 0.001401 },
            { name: "STR : +6%", probability: 0.004202 },
            { name: "DEX : +6%", probability: 0.004202 },
            { name: "INT : +6%", probability: 0.004202 },
            { name: "LUK : +6%", probability: 0.004202 },
            { name: "데미지 : +6%", probability: 0.001401 },
            { name: "올스탯 : +3%", probability: 0.002801 },
            { name: "공격 시 3% 확률로 53의 HP 회복", probability: 0.004202 },
            { name: "공격 시 3% 확률로 53의 MP 회복", probability: 0.004202 },
            { name: "몬스터 방어율 무시 : +3%", probability: 0.002801 },
          ],
          thirdLine: [
            { name: "최대 HP : +100", probability: 0.056022 },
            { name: "최대 MP : +100", probability: 0.056022 },
            { name: "이동속도 : +6", probability: 0.056022 },
            { name: "점프력 : +6", probability: 0.056022 },
            { name: "방어력 : +100", probability: 0.056022 },
            { name: "STR : +12", probability: 0.056022 },
            { name: "DEX : +12", probability: 0.056022 },
            { name: "INT : +12", probability: 0.056022 },
            { name: "LUK : +12", probability: 0.056022 },
            { name: "공격력 : +12", probability: 0.037348 },
            { name: "마력 : +12", probability: 0.037348 },
            { name: "최대 HP : +2%", probability: 0.037348 },
            { name: "최대 MP : +2%", probability: 0.037348 },
            { name: "STR : +3%", probability: 0.037348 },
            { name: "DEX : +3%", probability: 0.037348 },
            { name: "INT : +3%", probability: 0.037348 },
            { name: "LUK : +3%", probability: 0.037348 },
            { name: "공격력 : +3%", probability: 0.018674 },
            { name: "마력 : +3%", probability: 0.018674 },
            { name: "크리티컬 확률 : +4%", probability: 0.037348 },
            { name: "데미지 : +3%", probability: 0.018674 },
            { name: "올스탯 : +5", probability: 0.056022 },
            { name: "최대 HP : +5%", probability: 0.004202 },
            { name: "최대 MP : +5%", probability: 0.004202 },
            { name: "공격력 : +6%", probability: 0.002801 },
            { name: "마력 : +6%", probability: 0.002801 },
            { name: "크리티컬 확률 : +6%", probability: 0.001401 },
            { name: "STR : +6%", probability: 0.004202 },
            { name: "DEX : +6%", probability: 0.004202 },
            { name: "INT : +6%", probability: 0.004202 },
            { name: "LUK : +6%", probability: 0.004202 },
            { name: "데미지 : +6%", probability: 0.001401 },
            { name: "올스탯 : +3%", probability: 0.002801 },
            { name: "공격 시 3% 확률로 53의 HP 회복", probability: 0.004202 },
            { name: "공격 시 3% 확률로 53의 MP 회복", probability: 0.004202 },
            { name: "몬스터 방어율 무시 : +3%", probability: 0.002801 },
          ],
        },
      },
      유니크: {
        "120": {
          firstLine: [
            { name: "최대 HP : +8%", probability: 0.069767 },
            { name: "최대 MP : +8%", probability: 0.069767 },
            { name: "공격력 : +9%", probability: 0.046512 },
            { name: "마력 : +9%", probability: 0.046512 },
            { name: "크리티컬 확률 : +9%", probability: 0.046512 },
            { name: "STR : +9%", probability: 0.069767 },
            { name: "DEX : +9%", probability: 0.069767 },
            { name: "INT : +9%", probability: 0.069767 },
            { name: "LUK : +9%", probability: 0.069767 },
            { name: "데미지 : +9%", probability: 0.023256 },
            { name: "올스탯 : +6%", probability: 0.046512 },
            { name: "캐릭터 기준 9레벨 당 STR : +1", probability: 0.046512 },
            { name: "캐릭터 기준 9레벨 당 DEX : +1", probability: 0.046512 },
            { name: "캐릭터 기준 9레벨 당 INT : +1", probability: 0.046512 },
            { name: "캐릭터 기준 9레벨 당 LUK : +1", probability: 0.046512 },
            { name: "공격 시 15% 확률로 95의 HP 회복", probability: 0.069767 },
            { name: "공격 시 15% 확률로 95의 MP 회복", probability: 0.069767 },
            { name: "몬스터 방어율 무시 : +4%", probability: 0.023256 },
            { name: "보스 몬스터 공격 시 데미지 : +12%", probability: 0.023256 },
          ],
          secondLine: [
            { name: "최대 HP : +5%", probability: 0.086505 },
            { name: "최대 MP : +5%", probability: 0.086505 },
            { name: "공격력 : +6%", probability: 0.05767 },
            { name: "마력 : +6%", probability: 0.05767 },
            { name: "크리티컬 확률 : +6%", probability: 0.028835 },
            { name: "STR : +6%", probability: 0.086505 },
            { name: "DEX : +6%", probability: 0.086505 },
            { name: "INT : +6%", probability: 0.086505 },
            { name: "LUK : +6%", probability: 0.086505 },
            { name: "데미지 : +6%", probability: 0.028835 },
            { name: "올스탯 : +3%", probability: 0.05767 },
            { name: "공격 시 3% 확률로 53의 HP 회복", probability: 0.086505 },
            { name: "공격 시 3% 확률로 53의 MP 회복", probability: 0.086505 },
            { name: "몬스터 방어율 무시 : +3%", probability: 0.05767 },
            { name: "최대 HP : +8%", probability: 0.001368 },
            { name: "최대 MP : +8%", probability: 0.001368 },
            { name: "공격력 : +9%", probability: 0.000912 },
            { name: "마력 : +9%", probability: 0.000912 },
            { name: "크리티컬 확률 : +9%", probability: 0.000912 },
            { name: "STR : +9%", probability: 0.001368 },
            { name: "DEX : +9%", probability: 0.001368 },
            { name: "INT : +9%", probability: 0.001368 },
            { name: "LUK : +9%", probability: 0.001368 },
            { name: "데미지 : +9%", probability: 0.000456 },
            { name: "올스탯 : +6%", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 STR : +1", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 DEX : +1", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 INT : +1", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 LUK : +1", probability: 0.000912 },
            { name: "공격 시 15% 확률로 95의 HP 회복", probability: 0.001368 },
            { name: "공격 시 15% 확률로 95의 MP 회복", probability: 0.001368 },
            { name: "몬스터 방어율 무시 : +4%", probability: 0.000456 },
            { name: "보스 몬스터 공격 시 데미지 : +12%", probability: 0.000456 },
          ],
          thirdLine: [
            { name: "최대 HP : +5%", probability: 0.086505 },
            { name: "최대 MP : +5%", probability: 0.086505 },
            { name: "공격력 : +6%", probability: 0.05767 },
            { name: "마력 : +6%", probability: 0.05767 },
            { name: "크리티컬 확률 : +6%", probability: 0.028835 },
            { name: "STR : +6%", probability: 0.086505 },
            { name: "DEX : +6%", probability: 0.086505 },
            { name: "INT : +6%", probability: 0.086505 },
            { name: "LUK : +6%", probability: 0.086505 },
            { name: "데미지 : +6%", probability: 0.028835 },
            { name: "올스탯 : +3%", probability: 0.05767 },
            { name: "공격 시 3% 확률로 53의 HP 회복", probability: 0.086505 },
            { name: "공격 시 3% 확률로 53의 MP 회복", probability: 0.086505 },
            { name: "몬스터 방어율 무시 : +3%", probability: 0.05767 },
            { name: "최대 HP : +8%", probability: 0.001368 },
            { name: "최대 MP : +8%", probability: 0.001368 },
            { name: "공격력 : +9%", probability: 0.000912 },
            { name: "마력 : +9%", probability: 0.000912 },
            { name: "크리티컬 확률 : +9%", probability: 0.000912 },
            { name: "STR : +9%", probability: 0.001368 },
            { name: "DEX : +9%", probability: 0.001368 },
            { name: "INT : +9%", probability: 0.001368 },
            { name: "LUK : +9%", probability: 0.001368 },
            { name: "데미지 : +9%", probability: 0.000456 },
            { name: "올스탯 : +6%", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 STR : +1", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 DEX : +1", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 INT : +1", probability: 0.000912 },
            { name: "캐릭터 기준 9레벨 당 LUK : +1", probability: 0.000912 },
            { name: "공격 시 15% 확률로 95의 HP 회복", probability: 0.001368 },
            { name: "공격 시 15% 확률로 95의 MP 회복", probability: 0.001368 },
            { name: "몬스터 방어율 무시 : +4%", probability: 0.000456 },
            { name: "보스 몬스터 공격 시 데미지 : +12%", probability: 0.000456 },
          ],
        },
      },
      레전드리: {
        "120": {
          firstLine: [
            { name: "최대 HP : +11%", probability: 0.076923 },
            { name: "최대 MP : +11%", probability: 0.076923 },
            { name: "공격력 : +12%", probability: 0.051282 },
            { name: "마력 : +12%", probability: 0.051282 },
            { name: "크리티컬 확률 : +12%", probability: 0.051282 },
            { name: "STR : +12%", probability: 0.076923 },
            { name: "DEX : +12%", probability: 0.076923 },
            { name: "INT : +12%", probability: 0.076923 },
            { name: "LUK : +12%", probability: 0.076923 },
            { name: "데미지 : +12%", probability: 0.025641 },
            { name: "올스탯 : +9%", probability: 0.051282 },
            { name: "캐릭터 기준 9레벨 당 STR : +2", probability: 0.051282 },
            { name: "캐릭터 기준 9레벨 당 DEX : +2", probability: 0.051282 },
            { name: "캐릭터 기준 9레벨 당 INT : +2", probability: 0.051282 },
            { name: "캐릭터 기준 9레벨 당 LUK : +2", probability: 0.051282 },
            { name: "공격력 : +32", probability: 0.025641 },
            { name: "마력 : +32", probability: 0.025641 },
            { name: "몬스터 방어율 무시 : +5%", probability: 0.025641 },
            { name: "보스 몬스터 공격 시 데미지 : +18%", probability: 0.025641 },
          ],
          secondLine: [
            { name: "최대 HP : +8%", probability: 0.06942 },
            { name: "최대 MP : +8%", probability: 0.06942 },
            { name: "공격력 : +9%", probability: 0.04628 },
            { name: "마력 : +9%", probability: 0.04628 },
            { name: "크리티컬 확률 : +9%", probability: 0.04628 },
            { name: "STR : +9%", probability: 0.06942 },
            { name: "DEX : +9%", probability: 0.06942 },
            { name: "INT : +9%", probability: 0.06942 },
            { name: "LUK : +9%", probability: 0.06942 },
            { name: "데미지 : +9%", probability: 0.02314 },
            { name: "올스탯 : +6%", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 STR : +1", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 DEX : +1", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 INT : +1", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 LUK : +1", probability: 0.04628 },
            { name: "공격 시 15% 확률로 95의 HP 회복", probability: 0.06942 },
            { name: "공격 시 15% 확률로 95의 MP 회복", probability: 0.06942 },
            { name: "몬스터 방어율 무시 : +4%", probability: 0.02314 },
            { name: "보스 몬스터 공격 시 데미지 : +12%", probability: 0.02314 },
            { name: "최대 HP : +11%", probability: 0.0003827 },
            { name: "최대 MP : +11%", probability: 0.0003827 },
            { name: "공격력 : +12%", probability: 0.0002551 },
            { name: "마력 : +12%", probability: 0.0002551 },
            { name: "크리티컬 확률 : +12%", probability: 0.0002551 },
            { name: "STR : +12%", probability: 0.0003827 },
            { name: "DEX : +12%", probability: 0.0003827 },
            { name: "INT : +12%", probability: 0.0003827 },
            { name: "LUK : +12%", probability: 0.0003827 },
            { name: "데미지 : +12%", probability: 0.0001276 },
            { name: "올스탯 : +9%", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 STR : +2", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 DEX : +2", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 INT : +2", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 LUK : +2", probability: 0.0002551 },
            { name: "공격력 : +32", probability: 0.0001276 },
            { name: "마력 : +32", probability: 0.0001276 },
            { name: "몬스터 방어율 무시 : +5%", probability: 0.0001276 },
            { name: "보스 몬스터 공격 시 데미지 : +18%", probability: 0.0001276 },
          ],
          thirdLine: [
            { name: "최대 HP : +8%", probability: 0.06942 },
            { name: "최대 MP : +8%", probability: 0.06942 },
            { name: "공격력 : +9%", probability: 0.04628 },
            { name: "마력 : +9%", probability: 0.04628 },
            { name: "크리티컬 확률 : +9%", probability: 0.04628 },
            { name: "STR : +9%", probability: 0.06942 },
            { name: "DEX : +9%", probability: 0.06942 },
            { name: "INT : +9%", probability: 0.06942 },
            { name: "LUK : +9%", probability: 0.06942 },
            { name: "데미지 : +9%", probability: 0.02314 },
            { name: "올스탯 : +6%", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 STR : +1", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 DEX : +1", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 INT : +1", probability: 0.04628 },
            { name: "캐릭터 기준 9레벨 당 LUK : +1", probability: 0.04628 },
            { name: "공격 시 15% 확률로 95의 HP 회복", probability: 0.06942 },
            { name: "공격 시 15% 확률로 95의 MP 회복", probability: 0.06942 },
            { name: "몬스터 방어율 무시 : +4%", probability: 0.02314 },
            { name: "보스 몬스터 공격 시 데미지 : +12%", probability: 0.02314 },
            { name: "최대 HP : +11%", probability: 0.0003827 },
            { name: "최대 MP : +11%", probability: 0.0003827 },
            { name: "공격력 : +12%", probability: 0.0002551 },
            { name: "마력 : +12%", probability: 0.0002551 },
            { name: "크리티컬 확률 : +12%", probability: 0.0002551 },
            { name: "STR : +12%", probability: 0.0003827 },
            { name: "DEX : +12%", probability: 0.0003827 },
            { name: "INT : +12%", probability: 0.0003827 },
            { name: "LUK : +12%", probability: 0.0003827 },
            { name: "데미지 : +12%", probability: 0.0001276 },
            { name: "올스탯 : +9%", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 STR : +2", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 DEX : +2", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 INT : +2", probability: 0.0002551 },
            { name: "캐릭터 기준 9레벨 당 LUK : +2", probability: 0.0002551 },
            { name: "공격력 : +32", probability: 0.0001276 },
            { name: "마력 : +32", probability: 0.0001276 },
            { name: "몬스터 방어율 무시 : +5%", probability: 0.0001276 },
            { name: "보스 몬스터 공격 시 데미지 : +18%", probability: 0.0001276 },
          ],
        },
      },
    },
    상의: {
      레어: {
        "120": {
          firstLine: [
            { name: "STR : +10", probability: 0.06383 },
            { name: "DEX : +10", probability: 0.06383 },
            { name: "INT : +10", probability: 0.06383 },
            { name: "LUK : +10", probability: 0.06383 },
            { name: "최대 HP : +100", probability: 0.06383 },
            { name: "최대 MP : +100", probability: 0.06383 },
            { name: "이동속도 : +6", probability: 0.06383 },
            { name: "점프력 : +6", probability: 0.06383 },
            { name: "공격력 : +10", probability: 0.042553 },
            { name: "마력 : +10", probability: 0.042553 },
            { name: "방어력 : +100", probability: 0.06383 },
            { name: "STR : +2%", probability: 0.042553 },
            { name: "DEX : +2%", probability: 0.042553 },
            { name: "INT : +2%", probability: 0.042553 },
            { name: "LUK : +2%", probability: 0.042553 },
            { name: "최대 HP : +2%", probability: 0.042553 },
            { name: "최대 MP : +2%", probability: 0.042553 },
            { name: "방어력 : +2%", probability: 0.042553 },
            { name: "올스탯 : +3", probability: 0.042553 },
          ],
          secondLine: [
            { name: "STR : +6", probability: 0.072622 },
            { name: "DEX : +6", probability: 0.072622 },
            { name: "INT : +6", probability: 0.072622 },
            { name: "LUK : +6", probability: 0.072622 },
            { name: "최대 HP : +60", probability: 0.108932 },
            { name: "최대 MP : +60", probability: 0.108932 },
            { name: "이동속도 : +4", probability: 0.108932 },
            { name: "점프력 : +4", probability: 0.108932 },
            { name: "공격력 : +3", probability: 0.072622 },
            { name: "마력 : +3", probability: 0.072622 },
            { name: "방어력 : +60", probability: 0.108932 },
            { name: "STR : +10", probability: 0.001252 },
            { name: "DEX : +10", probability: 0.001252 },
            { name: "INT : +10", probability: 0.001252 },
            { name: "LUK : +10", probability: 0.001252 },
            { name: "최대 HP : +100", probability: 0.001252 },
            { name: "최대 MP : +100", probability: 0.001252 },
            { name: "이동속도 : +6", probability: 0.001252 },
            { name: "점프력 : +6", probability: 0.001252 },
            { name: "공격력 : +10", probability: 0.0008344 },
            { name: "마력 : +10", probability: 0.0008344 },
            { name: "방어력 : +100", probability: 0.001252 },
            { name: "STR : +2%", probability: 0.0008344 },
            { name: "DEX : +2%", probability: 0.0008344 },
            { name: "INT : +2%", probability: 0.0008344 },
            { name: "LUK : +2%", probability: 0.0008344 },
            { name: "최대 HP : +2%", probability: 0.0008344 },
            { name: "최대 MP : +2%", probability: 0.0008344 },
            { name: "방어력 : +2%", probability: 0.0008344 },
            { name: "올스탯 : +3", probability: 0.0008344 },
          ],
          thirdLine: [
            { name: "STR : +6", probability: 0.072622 },
            { name: "DEX : +6", probability: 0.072622 },
            { name: "INT : +6", probability: 0.072622 },
            { name: "LUK : +6", probability: 0.072622 },
            { name: "최대 HP : +60", probability: 0.108932 },
            { name: "최대 MP : +60", probability: 0.108932 },
            { name: "이동속도 : +4", probability: 0.108932 },
            { name: "점프력 : +4", probability: 0.108932 },
            { name: "공격력 : +3", probability: 0.072622 },
            { name: "마력 : +3", probability: 0.072622 },
            { name: "방어력 : +60", probability: 0.108932 },
            { name: "STR : +10", probability: 0.001252 },
            { name: "DEX : +10", probability: 0.001252 },
            { name: "INT : +10", probability: 0.001252 },
            { name: "LUK : +10", probability: 0.001252 },
            { name: "최대 HP : +100", probability: 0.001252 },
            { name: "최대 MP : +100", probability: 0.001252 },
            { name: "이동속도 : +6", probability: 0.001252 },
            { name: "점프력 : +6", probability: 0.001252 },
            { name: "공격력 : +10", probability: 0.0008344 },
            { name: "마력 : +10", probability: 0.0008344 },
            { name: "방어력 : +100", probability: 0.001252 },
            { name: "STR : +2%", probability: 0.0008344 },
            { name: "DEX : +2%", probability: 0.0008344 },
            { name: "INT : +2%", probability: 0.0008344 },
            { name: "LUK : +2%", probability: 0.0008344 },
            { name: "최대 HP : +2%", probability: 0.0008344 },
            { name: "최대 MP : +2%", probability: 0.0008344 },
            { name: "방어력 : +2%", probability: 0.0008344 },
            { name: "올스탯 : +3", probability: 0.0008344 },
          ],
        },
      },
    },
  };

  return optionPools[itemType][itemGrade][itemLevel] || { firstLine: [], secondLine: [], thirdLine: [] };
}
