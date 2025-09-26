import { prisma } from "../lib/prisma";

const defaults: Record<string, number> = {
  uptime_ratio_min: 65,
  keeper_foto_min: 1000,
  keeper_alt_foto_min: 600,
  keeper_alt_conversion_min: 40,
  keeper_alt_active_ratio_min: 80,
  optimize_foto_min: 600,
  optimize_conversion_max: 30,
  relocate_foto_min: 1,
  relocate_foto_max: 200,
};

async function main() {
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("✓ Seed settings OK");
}
main().finally(() => prisma.$disconnect());