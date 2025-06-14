import type { ItemEquipment } from "@/types/Equipment";

export const roundToHundred = (num: number) => {
  return Math.round(num / 100) * 100;
};

export const roundToTens = (num: number) => {
  return Math.round(num / 10) * 10;
};

export const getStarforceCost = (starforce: number, itemLevel: number) => {
  const baseCost = 1000;
  const itemLevelCubed = Math.pow(itemLevel, 3);

  const starforceDivisors: { [key: number]: number } = {
    0: 36,
    1: 36,
    2: 36,
    3: 36,
    4: 36,
    5: 36,
    6: 36,
    7: 36,
    8: 36,
    10: 571,
    11: 314,
    12: 214,
    13: 157,
    14: 107,
    15: 200,
    16: 200,
    17: 150,
    18: 70,
    19: 45,
    20: 200,
    21: 125,
  };

  const divisor = starforceDivisors[starforce] || 200;
  const multiplier = starforce < 9 ? starforce + 1 : Math.pow(starforce + 1, 2.7);
  return baseCost + (itemLevelCubed * multiplier) / divisor;
};

export interface StarforceProbability {
  success: number;
  fail: number;
  destroy?: number;
}

export const starforceProbabilities: { [key: number]: StarforceProbability } = {
  0: { success: 0.95, fail: 0.05 },
  1: { success: 0.9, fail: 0.1 },
  2: { success: 0.85, fail: 0.15 },
  3: { success: 0.85, fail: 0.15 },
  4: { success: 0.8, fail: 0.2 },
  5: { success: 0.75, fail: 0.25 },
  6: { success: 0.7, fail: 0.3 },
  7: { success: 0.65, fail: 0.35 },
  8: { success: 0.6, fail: 0.4 },
  9: { success: 0.55, fail: 0.45 },
  10: { success: 0.5, fail: 0.5 },
  11: { success: 0.45, fail: 0.55 },
  12: { success: 0.4, fail: 0.6 },
  13: { success: 0.35, fail: 0.65 },
  14: { success: 0.3, fail: 0.7 },
  15: { success: 0.3, fail: 0.679, destroy: 0.021 },
  16: { success: 0.3, fail: 0.679, destroy: 0.021 },
  17: { success: 0.15, fail: 0.782, destroy: 0.068 },
  18: { success: 0.15, fail: 0.782, destroy: 0.068 },
  19: { success: 0.15, fail: 0.765, destroy: 0.085 },
  20: { success: 0.3, fail: 0.595, destroy: 0.105 },
  21: { success: 0.15, fail: 0.7225, destroy: 0.1275 },
  22: { success: 0.15, fail: 0.68, destroy: 0.17 },
  23: { success: 0.1, fail: 0.72, destroy: 0.18 },
  24: { success: 0.1, fail: 0.72, destroy: 0.18 },
  25: { success: 0.1, fail: 0.72, destroy: 0.18 },
  26: { success: 0.07, fail: 0.744, destroy: 0.186 },
  27: { success: 0.05, fail: 0.76, destroy: 0.19 },
  28: { success: 0.03, fail: 0.776, destroy: 0.194 },
  29: { success: 0.01, fail: 0.792, destroy: 0.198 },
};

export const getStarforceProbability = (starforce: number): StarforceProbability => {
  return starforceProbabilities[starforce];
};

/** 스타포스 상승치 테이블 */
type StarforceUpgradeOptions = {
  itemLevel: number;
  starforce: number;
  itemSlot: string;
};
export const getStarforceUpgradeOptions = ({ itemLevel, starforce, itemSlot }: StarforceUpgradeOptions) => {
  const adjustedItemLevel = (() => {
    if (itemLevel <= 139) return 130;
    if (itemLevel <= 149) return 140;
    if (itemLevel <= 159) return 150;
    if (itemLevel <= 199) return 160;
    if (itemLevel <= 249) return 200;
    return 250;
  })();

  const _itemSlot = itemSlot !== "무기" && itemSlot !== "장갑" ? "all" : itemSlot;

  const statUpgradeOptions = STAT_UPGRADE_OPTIONS.all[adjustedItemLevel][starforce];
  const powerUpgradeOptions = POWER_UPGRADE_OPTIONS[_itemSlot][adjustedItemLevel][starforce];

  return {
    statUpgradeOptions,
    powerUpgradeOptions,
  } as const;
};

const STAT_UPGRADE_OPTIONS = {
  all: {
    "130": [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 7, 7, 7, 7, 7],
    "140": [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0],
    "150": [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 11, 11, 11, 11, 11, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0],
    "160": [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0],
    "200": [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 15, 15, 15, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0],
    "250": [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 17, 17, 17, 17, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0],
  },
} as const;

const POWER_UPGRADE_OPTIONS = {
  장갑: {
    "130": [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 7, 8, 9, 10, 11],
    "140": [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 8, 9, 10, 11, 12, 13, 15, 17, 19, 21, 22, 23, 24, 25, 26],
    "150": [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 23, 24, 25, 26, 27],
    "160": [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 10, 11, 12, 13, 14, 15, 17, 19, 21, 23, 24, 25, 26, 27, 28],
    "200": [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25, 26, 27, 28, 29, 30],
    "250": [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 14, 15, 16, 17, 18, 19, 21, 23, 25, 27, 28, 29, 30, 31, 32],
  },
  무기: {
    "130": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 7, 8, 9],
    "140": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 8, 8, 9, 10, 11, 12, 30, 31, 32],
    "150": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 11, 12, 13, 31, 32, 33],
    "160": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 10, 11, 12, 13, 14, 32, 33, 34],
    "200": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 14, 14, 15, 16, 17, 34, 35, 36, 37, 38, 39, 40, 41],
    "250": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  all: {
    "130": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 8, 9, 10, 11],
    "140": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 10, 11, 12, 13, 15, 17, 19, 21, 22, 23, 24, 25, 26],
    "150": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 23, 24, 25, 26, 27],
    "160": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 17, 19, 21, 23, 24, 25, 26, 27, 28],
    "200": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25, 26, 27, 28, 29, 30],
    "250": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 15, 16, 17, 18, 19, 21, 23, 25, 27, 28, 29, 30, 31, 32],
  },
} as const;
