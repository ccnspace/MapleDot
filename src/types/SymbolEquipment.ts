export type SymbolOption = {
  symbol_name: string;
  symbol_icon: string;
  symbol_description: string;
  symbol_force: string;
  symbol_level: number;
  symbol_str: string;
  symbol_dex: string;
  symbol_int: string;
  symbol_luk: string;
  symbol_hp: string;
  symbol_drop_rate: string;
  symbol_meso_rate: string;
  symbol_exp_rate: string;
  /** 현재 보유 성장치 */
  symbol_growth_count: number;
  /** 성장 시 필요한 성장치 */
  symbol_require_growth_count: number;
};

export type SymbolEquipmentInfo = {
  date: string | null;
  character_class: string;
  symbol: SymbolOption[];
};
