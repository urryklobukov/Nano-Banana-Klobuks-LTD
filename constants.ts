
import { PresetPrompt, AspectRatio } from "./types";

export const PRESET_PROMPTS: PresetPrompt[] = [
  { id: "retouch_base", prompt: "Retouch this photo" },
  { id: "retouch_colorize", prompt: "Colorize photo and enhance details" },
  { id: "retouch_remove_dust", prompt: "Remove dust and scratches" },
  { id: "retouch_enhance_clarity", prompt: "Enhance image detail and clarity without altering composition" },
  { id: "retouch_sharpen", prompt: "Restore and sharpen faded image" },
  { id: "retouch_fix_damage", prompt: "Fix damage and improve overall quality" },
  { id: "retouch_brighten", prompt: "Brighten and contrast enhance old photo" },
  { id: "retouch_restore_colors", prompt: "Restore faded colors to be vibrant and natural" },
  { id: "retouch_remove_frame", prompt: "Remove photo frame and repair torn edges" },
  { id: "retouch_improve_skin", prompt: "Improve skin texture and reduce facial blemishes" },
  { id: "retouch_remove_noise", prompt: "Remove digital noise and grain from the photo" },
  { id: "retouch_soft_focus", prompt: "Apply a dreamy soft-focus effect" },
];

export const REIMAGINE_PRESET_PROMPTS: PresetPrompt[] = [
    { id: "reimagine_studio_portrait", prompt: "Studio portrait of the subject(s) in modern, plain clothing against a light background." },
    { id: "reimagine_futuristic_city", prompt: "Place the subject(s) in a futuristic city with flying cars." },
    { id: "reimagine_ancient_jungle", prompt: "Reimagine the person(s) as explorers in a lush, ancient jungle." },
    { id: "reimagine_sunny_beach", prompt: "Show the subject(s) on a beautiful, sunny beach at sunset." },
    { id: "reimagine_rustic_cabin", prompt: "Depict the person(s) in a cozy, rustic cabin with a fireplace." },
    { id: "reimagine_fantasy_forest", prompt: "Transform the scene into a vibrant, fantastical forest with glowing plants." },
    { id: "reimagine_film_noir", prompt: "Place the character(s) in a classic, black-and-white film noir scene." },
    { id: "reimagine_art_deco", prompt: "Dress the person(s) in elegant 1920s Art Deco fashion." },
    { id: "reimagine_cyberpunk", prompt: "Change the outfits to rugged, futuristic cyberpunk gear." },
    { id: "reimagine_medieval", prompt: "Place the subject(s) in royal, medieval-era attire." },
    { id: "reimagine_zen_garden", prompt: "Reimagine the scene as a serene zen garden with cherry blossoms." },
    { id: "reimagine_steampunk", prompt: "Place the subject(s) in a bustling steampunk city with brass machinery." },
];

export const TEXT_TO_IMAGE_PRESET_PROMPTS: PresetPrompt[] = [
  { id: "text2img_cyberpunk_city", prompt: "A vibrant cyberpunk city street at night with neon signs and flying vehicles." },
  { id: "text2img_fantasy_dragon", prompt: "A majestic dragon soaring over snow-capped mountains at sunrise, fantasy art style." },
  { id: "text2img_futuristic_robot", prompt: "A sleek, chrome robot with glowing blue eyes, walking in a minimalistic white room." },
  { id: "text2img_enchanted_forest", prompt: "An enchanted forest with bioluminescent plants and a hidden waterfall, ethereal lighting." },
  { id: "text2img_space_colony", prompt: "A bustling human colony on a distant exoplanet, with advanced architecture and two suns in the sky." },
  { id: "text2img_steampunk_airship", prompt: "A large steampunk airship floating gracefully above a Victorian city, intricate details, golden hour." },
  { id: "text2img_underwater_city", prompt: "An ancient underwater city, ruins covered in coral and schools of colorful fish swimming through, lost civilization vibe." },
  { id: "text2img_desert_oasis", prompt: "A serene desert oasis at dusk, with palm trees, a clear pool, and a lone traveler resting under the stars." },
  { id: "text2img_magical_library", prompt: "A grand magical library filled with floating books, glowing runes, and mystical artifacts, warm ambient light." },
  { id: "text2img_abstract_geometry", prompt: "An abstract geometric composition with vibrant, overlapping shapes and dynamic lines, a sense of movement." },
  { id: "text2img_gothic_castle", prompt: "A dark and imposing gothic castle perched on a cliff overlooking a stormy sea, dramatic lighting." },
  { id: "text2img_cute_animal", prompt: "A cute fluffy fox cub playing in a field of wildflowers, soft natural lighting, whimsical." },
];

export const COMPOSITION_PRESET_PROMPTS: PresetPrompt[] = [
  { id: "composition_fantasy_collage", prompt: "Compose a fantasy collage with elements from all images, blending them seamlessly into an ethereal landscape." },
  { id: "composition_sci_fi_scene", prompt: "Combine all images into a cohesive sci-fi scene, creating a futuristic environment with technological overlays." },
  { id: "composition_dreamscape", prompt: "Generate a surreal dreamscape by merging subjects and backgrounds from each image with soft, blending transitions." },
  { id: "composition_urban_art", prompt: "Create an urban art piece, graffiti style, using elements from each photo as street art components." },
  { id: "composition_vintage_poster", prompt: "Design a vintage travel poster incorporating key visual elements from all provided images with a retro aesthetic." },
  { id: "composition_abstract_fusion", prompt: "Produce an abstract fusion of all images, focusing on colors, shapes, and textures to create a new artistic expression." },
];

export const ASPECT_RATIOS: AspectRatio[] = [
  'auto', '1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9'
];