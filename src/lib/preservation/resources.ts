/**
 * Shared free online resources for preserving guides.
 *
 * Every URL here was fetch-verified as free to read (no paywall or sign-up).
 * Reuse these constants in the per-category data files rather than repeating
 * URLs, so a moved page only needs fixing in one place.
 *
 * Verified: 2026-07-04
 */

import { PreservationResource } from '@/types/preservation'

// --- Method guides (authoritative, research-based) ---

/** National Center for Home Food Preservation (University of Georgia) */
export const NCHFP = {
  home: { title: 'Home food preservation methods', url: 'https://nchfp.uga.edu/', source: 'NCHFP' },
  canning: { title: 'How do I? Can', url: 'https://nchfp.uga.edu/how/can/', source: 'NCHFP' },
  freezing: { title: 'How do I? Freeze', url: 'https://nchfp.uga.edu/how/freeze/', source: 'NCHFP' },
  drying: { title: 'How do I? Dry', url: 'https://nchfp.uga.edu/how/dry/', source: 'NCHFP' },
  pickling: { title: 'How do I? Pickle', url: 'https://nchfp.uga.edu/how/pickle/', source: 'NCHFP' },
  fermenting: { title: 'How do I? Ferment', url: 'https://nchfp.uga.edu/how/ferment/', source: 'NCHFP' },
  jams: { title: 'How do I? Make jam & jelly', url: 'https://nchfp.uga.edu/how/make-jam-jelly/', source: 'NCHFP' },
} satisfies Record<string, PreservationResource>

/** USDA Complete Guide to Home Canning — free PDFs */
export const USDA_CANNING_GUIDE: PreservationResource = {
  title: 'USDA Complete Guide to Home Canning',
  url: 'https://nchfp.uga.edu/resources/category/usda-guide',
  source: 'USDA',
}

// --- UK storing & food-safety guidance ---

export const RHS_STORING_FRUIT: PreservationResource = {
  title: 'Storing apples, pears, quince and medlar',
  url: 'https://www.rhs.org.uk/fruit/fruit-trees/storing',
  source: 'RHS',
}

export const RHS_ONIONS: PreservationResource = {
  title: 'Growing, harvesting and storing onions',
  url: 'https://www.rhs.org.uk/vegetables/onions/grow-your-own',
  source: 'RHS',
}

export const GARDEN_ORGANIC_STORING: PreservationResource = {
  title: 'Harvesting and storing vegetables',
  url: 'https://www.gardenorganic.org.uk/expert-advice/garden-management/harvesting-and-storage/harvesting-and-storing-vegetables',
  source: 'Garden Organic',
}

export const FSA_FOOD_FACT_CHECKER: PreservationResource = {
  title: 'Home food fact checker (storage & freezing safety)',
  url: 'https://www.gov.uk/government/publications/home-food-fact-checker',
  source: 'Food Standards Agency',
}

// --- University extension guides (US, free, crop-by-crop) ---

export const PSU_LETS_PRESERVE: PreservationResource = {
  title: "'Let's Preserve' fact sheets (crop by crop)",
  url: 'https://extension.psu.edu/food-safety-and-quality/home-food-preservation-and-safety/lets-preserve',
  source: 'Penn State Extension',
}

export const UMN_PRESERVING: PreservationResource = {
  title: 'How to preserve your own food',
  url: 'https://extension.umn.edu/food-safety/preserving-and-preparing',
  source: 'UMN Extension',
}

export const UMN_HARVEST_STORAGE: PreservationResource = {
  title: 'Harvesting and storing home garden vegetables',
  url: 'https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables',
  source: 'UMN Extension',
}

export const UMN_SAUERKRAUT: PreservationResource = {
  title: 'How to make your own sauerkraut (fermentation basics)',
  url: 'https://extension.umn.edu/preserving-and-preparing/how-make-your-own-sauerkraut',
  source: 'UMN Extension',
}

// --- Recipe hubs (free, UK) ---

/**
 * BBC Food per-ingredient hub, e.g. bbcFoodIngredient('courgette', 'Courgette').
 * Slug pattern: lowercase, singular, underscores for spaces ('runner_bean').
 * Always spot-check the slug returns 200 before adding it to a guide.
 */
export function bbcFoodIngredient(slug: string, label: string): PreservationResource {
  return {
    title: `${label} recipes`,
    url: `https://www.bbc.co.uk/food/${slug}`,
    source: 'BBC Food',
  }
}

/**
 * BBC Food dish hub, e.g. bbcFoodDish('cranachan', 'Cranachan') — a per-dish
 * collection page in the same /food/<slug> namespace as ingredient hubs.
 * Verified working: cranachan, rhubarb_crumble, eton_mess, summer_pudding,
 * cauliflower_cheese, coleslaw, piccalilli, ratatouille, tomato_soup, champ,
 * mint_sauce, horseradish_sauce. Spot-check any new slug returns 200.
 */
export function bbcFoodDish(slug: string, label: string): PreservationResource {
  return {
    title: `${label} recipes`,
    url: `https://www.bbc.co.uk/food/${slug}`,
    source: 'BBC Food',
  }
}

/**
 * BBC Food single recipe page, e.g.
 * bbcFoodRecipe('stuffed_marrow_43279', 'Stuffed marrow'). The slug includes
 * the numeric id, so only use URLs verified to return 200 — never guess.
 */
export function bbcFoodRecipe(slug: string, title: string): PreservationResource {
  return {
    title,
    url: `https://www.bbc.co.uk/food/recipes/${slug}`,
    source: 'BBC Food',
  }
}

/**
 * BBC Good Food single recipe page, e.g.
 * bbcGoodFoodRecipe('colcannon', 'Colcannon'). Only use slugs verified to
 * return 200 AND checked non-premium ("isPremium":false in the page data).
 */
export function bbcGoodFoodRecipe(slug: string, title: string): PreservationResource {
  return {
    title,
    url: `https://www.bbcgoodfood.com/recipes/${slug}`,
    source: 'BBC Good Food',
  }
}

/**
 * Great British Chefs recipe page (free to read, ad-supported, no sign-up
 * wall), e.g. greatBritishChefsRecipe('clapshot-recipe', 'Clapshot').
 * Verify the slug returns 200 before adding.
 */
export function greatBritishChefsRecipe(slug: string, title: string): PreservationResource {
  return {
    title,
    url: `https://www.greatbritishchefs.com/recipes/${slug}`,
    source: 'Great British Chefs',
  }
}

/**
 * BBC Good Food collection, e.g. bbcGoodFoodCollection('jam-recipes', 'Jam recipes').
 * Only use slugs verified to return 200 — there is no generic 'chutney-recipes'
 * or 'glut-recipes' collection.
 */
export function bbcGoodFoodCollection(slug: string, label: string): PreservationResource {
  return {
    title: label,
    url: `https://www.bbcgoodfood.com/recipes/collection/${slug}`,
    source: 'BBC Good Food',
  }
}

/** Verified BBC Good Food collections useful across many crops */
export const BBC_GOOD_FOOD = {
  jams: bbcGoodFoodCollection('jam-recipes', 'Jam recipes'),
  pickles: bbcGoodFoodCollection('pickle-recipes', 'Pickle recipes'),
  chutneys: bbcGoodFoodCollection('pickles-jams-and-chutneys-recipes', 'Pickles, jams & chutneys'),
  glutCakes: bbcGoodFoodCollection('garden-glut-cake-recipes', 'Garden glut cakes'),
} satisfies Record<string, PreservationResource>

export const RIVER_COTTAGE_RECIPES: PreservationResource = {
  title: 'River Cottage recipes (filter by Preserves)',
  url: 'https://www.rivercottage.net/recipes',
  source: 'River Cottage',
}

export const WIKIBOOKS_COOKBOOK: PreservationResource = {
  title: 'Wikibooks Cookbook (canning, fermenting, pickling techniques)',
  url: 'https://en.wikibooks.org/wiki/Cookbook:Table_of_Contents',
  source: 'Wikibooks',
}
