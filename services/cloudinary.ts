const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Unsigned upload: only cloudName + upload_preset are needed. The Cloudinary
// API key/secret must never appear in client code — they'd give anyone who
// decompiles the app full control of the account. The upload_preset is what
// scopes what an anonymous client is allowed to do.
export async function uploadToCloudinary(imageUri: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary não configurado (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME / EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ausentes).'
    );
  }

  const data = new FormData();
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile-pic.jpg',
  } as unknown as Blob);
  data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: data }
  );

  if (!response.ok) {
    throw new Error('Falha no upload da imagem. Confira se o upload preset existe e está configurado como "Unsigned".');
  }

  const json = await response.json();
  return json.secure_url as string;
}
