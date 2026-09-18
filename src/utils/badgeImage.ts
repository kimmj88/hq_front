/** Render SVG as an isolated image, retaining transparency for the upload API. */
export async function prepareBadgeImage(file: File): Promise<File> {
  if (file.size > 5 * 1024 * 1024) throw new Error('5MB 이하의 이미지를 선택해주세요.');
  if (file.type !== 'image/svg+xml' && !/\.svg$/i.test(file.name)) {
    if (!['image/png', 'image/webp', 'image/jpeg'].includes(file.type)) {
      throw new Error('PNG, WebP, JPG, SVG 이미지를 선택해주세요.');
    }
    return file;
  }
  const url = URL.createObjectURL(new Blob([file], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height || width > 4096 || height > 4096) {
      throw new Error('SVG 이미지 크기는 가로·세로 각각 1~4096px이어야 합니다.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('이미지 변환을 지원하지 않는 브라우저입니다.');
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('SVG 이미지 변환에 실패했습니다.')), 'image/png');
    });
    if (blob.size > 5 * 1024 * 1024) throw new Error('변환된 이미지가 5MB를 초과합니다. SVG 크기를 줄여주세요.');
    return new File([blob], file.name.replace(/\.svg$/i, '') + '.png', { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
