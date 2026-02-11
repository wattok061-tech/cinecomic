
import { GoogleGenAI, Type } from "@google/genai";
import { ComicStyle, ComicPanelData } from "../types";

/**
 * Perform a deep narrative extraction of the video to create a coherent 6-panel storyboard.
 * Instructs the model to follow a professional narrative arc (Establishing, Inciting, Rising, Climax, Resolution).
 */
export const analyzeVideoToPanels = async (
  inputData: string, 
  mimeType: string, 
  style: ComicStyle, 
  duration: number,
  isYoutubeUrl: boolean = false
): Promise<{ panels: ComicPanelData[], title: string, charDesc: string, storySummary: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = isYoutubeUrl 
    ? `You are a World-Class Comic Book Scriptwriter. ANALYZE this YouTube footage: ${inputData}.`
    : `You are a World-Class Comic Book Scriptwriter. ANALYZE the provided footage. DURATION: ${duration.toFixed(2)}s.`;

  const instruction = `MISSION: Distill this footage into a professional 6-panel graphic novel sequence. 
  Follow these narrative transition rules:
  1. Establishing Shot: Wide shot to set the location/mood.
  2. Subject-to-Subject Transition: Focus on characters and their reactions.
  3. Action-to-Action Transition: Capture the kinetic energy of the main movement.
  4. The Climax: High-contrast, high-impact keyframe.
  5. The Resolution: A lingering shot that closes the narrative loop.

  OUTPUT JSON object:
  "title": A gripping, genre-accurate title (e.g. "THE MIDNIGHT RECKONING").
  "storySummary": A 2-sentence breakdown of the narrative arc extracted.
  "characterDescription": A detailed physical profile of the protagonist for artistic consistency.
  "panels": Array of 6 objects with "description" (detailed visual prompt including shot type/angle), "dialogue" (meaningful quip), and "onomatopoeia" (dramatic sound effect).`;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        storySummary: { type: Type.STRING },
        characterDescription: { type: Type.STRING },
        panels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              dialogue: { type: Type.STRING },
              onomatopoeia: { type: Type.STRING }
            },
            required: ["description", "dialogue", "onomatopoeia"]
          }
        }
      },
      required: ["title", "storySummary", "characterDescription", "panels"]
    }
  };

  const parts = isYoutubeUrl 
    ? [{ text: prompt + "\n\n" + instruction }]
    : [
        { inlineData: { data: inputData, mimeType } },
        { text: prompt + "\n\n" + instruction }
      ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: { parts },
      config
    });

    const result = JSON.parse(response.text || "{}");
    const mappedPanels = result.panels.map((p: any, index: number) => ({
      ...p,
      id: `panel-${index}-${Date.now()}`,
      generating: false,
      isCover: index === 0
    }));

    return {
      panels: mappedPanels,
      title: result.title,
      storySummary: result.storySummary,
      charDesc: result.characterDescription
    };
  } catch (e: any) {
    if (e.message?.includes("403") || e.message?.includes("PERMISSION_DENIED")) {
      throw new Error("PERMISSION_DENIED: Your API key project may need billing enabled. Try selecting a paid key in settings.");
    }
    throw e;
  }
};

/**
 * Generate a world-class comic panel image.
 */
export const generatePanelImage = async (panel: ComicPanelData, style: ComicStyle, charDesc: string = ""): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const stylePrompt = `Elite Graphic Novel Illustration, ${style}. 
  Protagonist visual traits: ${charDesc}. 
  SCENE: ${panel.description}. 
  Masterful use of shadows and lighting. Cinematic composition. 
  MANDATORY: NO TEXT, NO SPEECH BUBBLES, NO WATERMARKS, NO INTERFACE ELEMENTS.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: stylePrompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (error: any) {
    if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED")) {
       throw new Error("PERMISSION_DENIED: Access denied to the image generation model.");
    }
    throw error;
  }
  return "";
};
