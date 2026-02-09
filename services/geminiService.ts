
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ComicStyle, ComicPanelData } from "../types";

/**
 * Perform a deep narrative extraction of the video to create a coherent 6-panel storyboard.
 */
export const analyzeVideoToPanels = async (
  inputData: string, 
  mimeType: string, 
  style: ComicStyle, 
  duration: number,
  isYoutubeUrl: boolean = false
): Promise<ComicPanelData[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = isYoutubeUrl 
    ? `You are the World's Preeminent Comic Narrative Architect. 
       ANALYZE this YouTube source: ${inputData}. 
       ESTIMATED DURATION: ${duration} seconds.
       MISSION: Extract a masterpiece narrative arc. 
       1. Map the video's timeline into 6 specific beats. 
       2. Beat 1 (0-${duration*0.15}s): Hook/Inciting Incident. 
       3. Beat 2-4 (${duration*0.15}-${duration*0.7}s): Rising Action and Conflict. 
       4. Beat 5 (${duration*0.7}-${duration*0.9}s): The Dramatic Climax. 
       5. Beat 6 (${duration*0.9}-${duration}s): The Epic Resolution.
       The visual protocol is ${style}.`
    : `You are the World's Preeminent Comic Narrative Architect. 
       ANALYZE the provided footage. 
       DURATION: ${duration.toFixed(2)} seconds.
       MISSION: Identify the visual "soul" of this clip. 
       1. Perform a precise temporal analysis.
       2. Distill the ${duration.toFixed(2)}s into 6 chronologically perfect comic panels.
       3. Ensure each panel captures a distinct and major transition in the action or emotion.
       The visual protocol is ${style}.`;

  const instruction = `OUTPUT FORMAT: Valid JSON array of exactly 6 objects.
  As a master storyteller, your visual descriptions ("description") must be extremely detailed for the illustrator: 
  - Specify camera lens (e.g. 35mm, Wide Angle, Macro).
  - Specify lighting physics (e.g. dramatic backlighting, volumetric shadows, neon glow).
  - Describe character anatomy and dynamic poses that imply motion.
  - "dialogue": Cinematic, pithy, and impactful.
  - "onomatopoeia": Visually integrated sound effects that enhance the kinetic energy.`;

  const config: any = {
    responseMimeType: "application/json",
    thinkingConfig: { thinkingBudget: 8000 }, // High budget for deep narrative synthesis
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          dialogue: { type: Type.STRING },
          characterExpression: { type: Type.STRING },
          onomatopoeia: { type: Type.STRING }
        },
        required: ["description", "dialogue", "characterExpression", "onomatopoeia"]
      }
    }
  };

  if (isYoutubeUrl) {
    config.tools = [{ googleSearch: {} }];
  }

  const parts = isYoutubeUrl 
    ? [{ text: prompt + "\n\n" + instruction }]
    : [
        { inlineData: { data: inputData, mimeType } },
        { text: prompt + "\n\n" + instruction }
      ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: { parts },
    config
  });

  try {
    const text = response.text || "[]";
    const panels = JSON.parse(text);
    return panels.map((p: any, index: number) => ({
      ...p,
      id: `panel-${index}-${Date.now()}`,
      generating: false
    }));
  } catch (e) {
    console.error("Storytelling Analysis Failed", e);
    throw new Error("STORYTELLING FAILURE: The AI could not weave a coherent arc from the source material.");
  }
};

/**
 * Generate a world-class comic panel image using the Pro model.
 */
export const generatePanelImage = async (panel: ComicPanelData, style: ComicStyle): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const stylePrompt = `MASTERPIECE ILLUSTRATION. World-class comic book art.
  STYLE PROTOCOL: ${style}. 
  SCENE DESCRIPTION: ${panel.description}. 
  ACTING: ${panel.characterExpression}. 
  COMPOSITION: Dynamic, cinematic, professional comic layout. 
  QUALITY: Intricate ink-work, masterful shading, professional digital coloring. 
  STRICT RULE: NO TEXT. NO SPEECH BUBBLES. NO CAPTIONS.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: stylePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (error: any) {
    console.error("Image Synthesis Error:", error);
    return fallbackGenerateImage(panel, style);
  }

  throw new Error("INKING FAILURE: The render engine stalled.");
};

const fallbackGenerateImage = async (panel: ComicPanelData, style: ComicStyle): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Professional comic book panel, ${style}: ${panel.description}. Cinematic lighting.` }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : "";
};
