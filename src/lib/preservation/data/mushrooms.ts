/**
 * Mushrooms — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import { NCHFP, bbcFoodIngredient, bbcGoodFoodCollection } from '../resources'

export const mushroomsPreservation: PreservationGuide[] = [
  {
    plantId: 'oyster-mushroom',
    summary:
      'Flushes come all at once — use fresh within days, then dry or cook-and-freeze the rest. Never home-can mushrooms.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep in a paper bag in the fridge, never a sealed plastic one — they sweat and slime. Use within a few days of picking.',
        storageLife: '3–5 days in a paper bag',
      },
      {
        method: 'dry',
        how: 'Tear into strips and dry in a dehydrator or low oven until cracker-crisp, then store airtight. Rehydrate in warm water for soups and noodles — the soaking liquid is free stock.',
        storageLife: '1 year+ airtight and dry',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Saute in butter or dry-fry until the moisture is gone, cool, and freeze in portions. Raw mushrooms freeze to mush; cooked ones hold up fine.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('oyster_mushroom', 'Oyster mushroom'),
      bbcGoodFoodCollection('mushroom-recipes', 'Mushroom recipes'),
    ],
  },
  {
    plantId: 'shiitake',
    summary:
      'The one mushroom that improves with drying — the flavour deepens and the stock from soaked caps is a bonus.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep fresh caps a week in a paper bag in the fridge. Save the tough stems in the freezer for stock.',
        storageLife: 'up to 1 week in a paper bag',
      },
      {
        method: 'dry',
        how: 'Slice or thread whole caps and dry in a dehydrator, low oven or airing cupboard until brittle, then store airtight. Dried shiitake tastes stronger than fresh — soak 20–30 minutes before cooking.',
        storageLife: '1 year+ airtight and dry',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Saute sliced caps until dry in the pan, then cool and freeze in meal-sized bags. Freezing is the route for cooked surplus; drying beats it for flavour.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('shiitake_mushroom', 'Shiitake mushroom'),
      bbcGoodFoodCollection('mushroom-recipes', 'Mushroom recipes'),
    ],
  },
  {
    plantId: 'lions-mane',
    summary:
      'Delicate and quick to spoil — eat fresh within days, freeze cooked slices, or dry the surplus for powder and broths.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep whole in a paper bag in the fridge and use within a few days — it browns and sours faster than most mushrooms.',
        storageLife: '3–5 days in a paper bag',
      },
      {
        method: 'freeze',
        how: 'Slice into steaks and dry-fry or saute until golden and the moisture is gone, then cool and freeze flat. Cooked first it keeps its lovely crab-like texture; raw it turns to sponge.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Tear into chunks and dry low and slow until hard, then store airtight. Dried pieces are chewy rehydrated, so most folk blitz them to powder for broths and gravies.',
        storageLife: '1 year+ airtight and dry',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('mushroom-recipes', 'Mushroom recipes')],
  },
  {
    plantId: 'king-oyster',
    summary:
      'The best keeper of the home-grown mushrooms — a week or more in the fridge, and thick slices dry and freeze well.',
    methods: [
      {
        method: 'fridge',
        how: 'Keeps longer than most mushrooms thanks to its dense flesh — a paper bag in the fridge buys you a week or more.',
        storageLife: '7–10 days in a paper bag',
      },
      {
        method: 'dry',
        how: 'Slice lengthways into thick strips and dry until leathery-hard, then store airtight. Rehydrated slices keep a good meaty chew for stews and stir-fries.',
        storageLife: '1 year+ airtight and dry',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Slice into coins or scored steaks, saute until browned, then cool and freeze in portions. Cooked first, the meaty texture survives the freezer.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('mushroom', 'Mushroom'),
      bbcGoodFoodCollection('mushroom-recipes', 'Mushroom recipes'),
    ],
  },
  {
    plantId: 'button-mushroom',
    summary:
      'A steady cropper rather than a glut crop — fridge for the week, cook-and-freeze or dry anything beyond that.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep in a paper bag in the fridge and use within the week. Do not wash until you cook them — damp buttons slime fast.',
        storageLife: '5–7 days in a paper bag',
      },
      {
        method: 'freeze',
        how: 'Saute sliced or halved buttons until the liquid cooks off, then cool and freeze in portions for sauces, stews and fry-ups. Freezing or drying only — mushrooms are a classic low-acid canning risk.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Slice 5mm thick and dry in a dehydrator or low oven until crisp, then store airtight in the dark. Blitz a jarful to mushroom powder for instant umami in gravies.',
        storageLife: '1 year+ airtight and dry',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('mushroom', 'Mushroom'),
      bbcGoodFoodCollection('mushroom-recipes', 'Mushroom recipes'),
    ],
  },
]
