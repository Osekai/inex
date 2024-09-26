export type IconsId =
  | "logo-osekai"
  | "gamemode-taiko"
  | "gamemode-osu"
  | "gamemode-mania"
  | "gamemode-catch"
  | "gamemode-all";

export type IconsKey =
  | "LogoOsekai"
  | "GamemodeTaiko"
  | "GamemodeOsu"
  | "GamemodeMania"
  | "GamemodeCatch"
  | "GamemodeAll";

export enum Icons {
  LogoOsekai = "logo-osekai",
  GamemodeTaiko = "gamemode-taiko",
  GamemodeOsu = "gamemode-osu",
  GamemodeMania = "gamemode-mania",
  GamemodeCatch = "gamemode-catch",
  GamemodeAll = "gamemode-all",
}

export const ICONS_CODEPOINTS: { [key in Icons]: string } = {
  [Icons.LogoOsekai]: "61697",
  [Icons.GamemodeTaiko]: "61698",
  [Icons.GamemodeOsu]: "61699",
  [Icons.GamemodeMania]: "61700",
  [Icons.GamemodeCatch]: "61701",
  [Icons.GamemodeAll]: "61702",
};
