import type { CharacterBase } from "@/types/Character";
import { apiFetcher } from "./apiFetcher";

export const getCharacterBaseInfo = async (nickname: string, date = "") => {
  const response = await apiFetcher<CharacterBase>(
    `/user/${nickname}?date=${date}`
  );
  return response;
};
