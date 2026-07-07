require("dotenv").config();

const prisma = require("../src/config/prisma");
const { normalizeStoredImage, uploadProviderImage } = require("../src/utils/imagekit");

function parseBase64Image(value) {
  if (typeof value !== "string") return null;

  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) return null;

  const mimetype = match[1].replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2], "base64");

  return {
    buffer,
    mimetype,
    size: buffer.length,
    originalname: `provider-migration.${mimetype.split("/")[1]}`,
  };
}

async function migrate() {
  const providers = await prisma.providerProfile.findMany({
    select: {
      id: true,
      profileImages: true,
    },
  });

  let migratedProviders = 0;
  let uploadedImages = 0;
  let skippedProviders = 0;

  for (const provider of providers) {
    const images = Array.isArray(provider.profileImages)
      ? provider.profileImages
      : [];

    let changed = false;
    const nextImages = [];

    for (const [index, image] of images.entries()) {
      const normalized = normalizeStoredImage(image);
      if (normalized) {
        nextImages.push(normalized);
        continue;
      }

      const file = parseBase64Image(image);
      if (!file) continue;

      const uploaded = await uploadProviderImage(file, index);
      nextImages.push(uploaded);
      uploadedImages += 1;
      changed = true;
    }

    if (!changed) {
      skippedProviders += 1;
      continue;
    }

    await prisma.providerProfile.update({
      where: { id: provider.id },
      data: { profileImages: nextImages },
    });

    migratedProviders += 1;
    console.log(`Migrated provider ${provider.id}: ${nextImages.length} images`);
  }

  console.log(
    `Migration complete. Providers migrated: ${migratedProviders}. Images uploaded: ${uploadedImages}. Providers skipped: ${skippedProviders}.`
  );
}

migrate()
  .catch((error) => {
    console.error("Provider image migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
