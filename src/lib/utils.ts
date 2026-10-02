import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The design system adds its own type scale (text-label-md, text-headline-lg…).
 * tailwind-merge cannot know those are font sizes, so it files them under
 * text-colour and drops whatever colour came before — `cn("text-white
 * text-label-md")` silently resolved to `text-label-md`, leaving the element
 * with the inherited body colour. White icons on a blue button, invisible.
 *
 * Declaring the scale here fixes every cn() call at once.
 */
const TYPE_SCALE = [
  'label-sm', 'label-md', 'label-lg',
  'body-sm', 'body-md', 'body-lg',
  'headline-sm', 'headline-md', 'headline-lg',
  'display',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SCALE }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImage(base64Str: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (!base64Str || !base64Str.startsWith('data:')) {
        resolve(base64Str);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (!width || !height) {
            resolve(base64Str);
            return;
          }

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(base64Str);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed data url
          const result = canvas.toDataURL('image/jpeg', quality);
          
          // Verify result is valid, otherwise fallback
          if (!result || result === 'data:,') {
            resolve(base64Str);
            return;
          }

          // If still too large (> 1.2MB) and quality is high enough, reduce quality and try again
          if (result.length > 1200000 && quality > 0.2) {
            compressImage(base64Str, maxWidth, quality - 0.25)
              .then(resolve)
              .catch(() => resolve(result));
          } else {
            resolve(result);
          }
        } catch (err) {
          console.warn("Error in compression onload:", err);
          resolve(base64Str);
        }
      };

      img.onerror = (err) => {
        console.warn("compressImage: Image load error, falling back to original base64", err);
        resolve(base64Str);
      };

      img.src = base64Str;
    } catch (outerErr) {
      console.warn("compressImage outer error:", outerErr);
      resolve(base64Str);
    }
  });
}
