import { adhesionMultiseed, motilityMultiseed, shiftCycleMultiseed, type SeedHoldCampaign } from "./campaign";

export const T2_ATLAS_SEEDS = Array.from({ length: 32 }, (_, i) => i);

export type T2Atlas = {
  name: "t2-atlas-32";
  seeds: number[];
  contrasts: {
    adhesion: SeedHoldCampaign;
    motility: SeedHoldCampaign;
    shiftCycle: SeedHoldCampaign;
  };
};

export function buildT2Atlas(
  seeds: readonly number[] = T2_ATLAS_SEEDS,
  hours: { adhesion?: number; motility?: number; shift?: number } = {},
): T2Atlas {
  return {
    name: "t2-atlas-32",
    seeds: [...seeds],
    contrasts: {
      adhesion: adhesionMultiseed(hours.adhesion ?? 160, seeds),
      motility: motilityMultiseed(hours.motility ?? 160, seeds),
      shiftCycle: shiftCycleMultiseed(hours.shift ?? 90, seeds),
    },
  };
}

export function atlasSummary(atlas: T2Atlas) {
  const fail = (c: SeedHoldCampaign) => c.rows.filter((r) => !r.hold).map((r) => r.seed);
  return {
    adhesion: { held: atlas.contrasts.adhesion.held, n: atlas.contrasts.adhesion.rows.length, fail: fail(atlas.contrasts.adhesion) },
    motility: { held: atlas.contrasts.motility.held, n: atlas.contrasts.motility.rows.length, fail: fail(atlas.contrasts.motility) },
    shiftCycle: { held: atlas.contrasts.shiftCycle.held, n: atlas.contrasts.shiftCycle.rows.length, fail: fail(atlas.contrasts.shiftCycle) },
  };
}
