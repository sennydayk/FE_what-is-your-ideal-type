import OpenAI from 'openai';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

type orderType = {
  gender: string;
  age: string;
  bodyShape: string;
  faceShape: string;
  skinTone: string;
  eyesShape: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
};

function createPersonDescription(order: orderType) {
  const pronoun = order.gender === 'man' ? 'He' : 'She';
  const possessiveAdjective = order.gender === 'man' ? 'his' : 'her';

  const intro = `Create a realistic and passport-style image of a Korean ${order.gender} in ${possessiveAdjective} ${order.age}. ${pronoun} should not be holding a passport`;

  const eyes = `${pronoun} has ${order.eyesShape}.`;

  const body = `${pronoun} has a ${order.bodyShape} physique.`;

  const face = `${pronoun} has a ${order.faceShape} face with ${order.skinTone} skin tone.`;

  const hair = `${pronoun} has ${order.hairStyle} styled hair in ${order.hairColor}.`;

  const outfit = `${pronoun} is dressed in a well-fitted, perfectly coordinated ${order.outfit}. The clothing should be modern, trendy, and appropriate.`;

  const background = `The image should be set against a plain light-colored background with soft, even lighting, creating a natural, polished, and refined look. There should be no visible passport in the image.`;

  return `${intro} ${eyes} ${body} ${face} ${hair} ${outfit} ${background}`;
}

export async function imageGenerate(order: orderType) {
  const prompt = createPersonDescription(order);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });

    return {
      ...response?.data[0],
      usedPrompt: prompt, // 실제 사용된 프롬프트 추가
    };
  } catch (err) {
    console.error(err);
  }
}
