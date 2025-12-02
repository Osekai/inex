export type IconsId =
  | "tp-twitter"
  | "tp-discord"
  | "tp-bluesky"
  | "omh"
  | "logo-osekai"
  | "gamemode-taiko"
  | "gamemode-osu"
  | "gamemode-mania"
  | "gamemode-catch"
  | "gamemode-all";

export type IconsKey =
  | "TpTwitter"
  | "TpDiscord"
  | "TpBluesky"
  | "Omh"
  | "LogoOsekai"
  | "GamemodeTaiko"
  | "GamemodeOsu"
  | "GamemodeMania"
  | "GamemodeCatch"
  | "GamemodeAll";

export enum Icons {
  TpTwitter = "tp-twitter",
  TpDiscord = "tp-discord",
  TpBluesky = "tp-bluesky",
  Omh = "omh",
  LogoOsekai = "logo-osekai",
  GamemodeTaiko = "gamemode-taiko",
  GamemodeOsu = "gamemode-osu",
  GamemodeMania = "gamemode-mania",
  GamemodeCatch = "gamemode-catch",
  GamemodeAll = "gamemode-all",
}

export const ICONS_CODEPOINTS: { [key in Icons]: string } = {
  [Icons.TpTwitter]: "61697",
  [Icons.TpDiscord]: "61698",
  [Icons.TpBluesky]: "61699",
  [Icons.Omh]: "61700",
  [Icons.LogoOsekai]: "61701",
  [Icons.GamemodeTaiko]: "61702",
  [Icons.GamemodeOsu]: "61703",
  [Icons.GamemodeMania]: "61704",
  [Icons.GamemodeCatch]: "61705",
  [Icons.GamemodeAll]: "61706",
};
