/**
 * Cucurbits — Preserving guides
 * Authoring spec: docs/plans/food-preservation-plan.md
 *
 * This file is the exemplar for the other category files: short practical
 * how-tos, storage life where known, shared resource constants from
 * ../resources, and only URL slugs that have been verified to return 200.
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  GARDEN_ORGANIC_STORING,
  UMN_HARVEST_STORAGE,
  BBC_GOOD_FOOD,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
} from '../resources'

export const cucurbitsPreservation: PreservationGuide[] = [
  {
    plantId: 'courgette',
    summary:
      'The classic glut crop — one week in the fridge, then it is grate-and-freeze, chutney and cake territory.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in the salad drawer in a loose bag. Pick small and often — big marrows keep no better.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Grate raw and freeze in cake- or soup-sized portions, or blanch 1cm slices for 1 minute before bagging. Grated needs no blanching.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Courgette chutney is the best use for the ones that got away — cube, salt, then simmer with vinegar, sugar and spices.',
        storageLife: '1 year+ in sealed jars',
        resources: [BBC_GOOD_FOOD.chutneys],
      },
      {
        method: 'pickle',
        how: 'Slice thinly, brine for an hour, then pack in a spiced sweet vinegar. Good in cheese sandwiches all winter.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('courgette', 'Courgette'),
      bbcGoodFoodCollection('courgette-cake-recipes', 'Courgette cake recipes'),
      BBC_GOOD_FOOD.glutCakes,
    ],
  },
  {
    plantId: 'squash',
    summary: 'Cure well and winter squash will feed you until spring with no processing at all.',
    methods: [
      {
        method: 'cure',
        how: 'Cure in any late sun (or a greenhouse) for 10–14 days until the skin is too hard to mark with a thumbnail. Leave a stub of stalk on.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store somewhere cool, dry and frost-free (10–15°C) with air around each fruit — a shelf, not a heap. Check monthly for soft spots.',
        storageLife: '3–6 months depending on variety',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Roast or steam, mash, and freeze in tubs — ready for soup. Raw squash freezes badly.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('squash', 'Squash')],
  },
  {
    plantId: 'pumpkin',
    summary: 'Treat like winter squash: cure hard, store cool, and turn the flesh into soup and cakes.',
    methods: [
      {
        method: 'cure',
        how: 'Cure in the sun for 10–14 days until the skin hardens, keeping the stalk stub intact.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store cool, dry and frost-free with space between fruits. Culinary varieties keep longer than carving types.',
        storageLife: '2–4 months',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Cook and purée before freezing — perfect for soup, pie and baking. Never can pumpkin purée at home; freezing is the safe route.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('pumpkin', 'Pumpkin'),
      bbcGoodFoodCollection('pumpkin-recipes', 'Pumpkin recipes'),
    ],
  },
  {
    plantId: 'patty-pan-squash',
    summary: 'A summer squash like courgette — eat fresh and young, pickle the surplus.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in the salad drawer. Best picked small (5–8cm) and eaten within the week.',
        storageLife: 'about 1 week',
      },
      {
        method: 'pickle',
        how: 'Small whole patty pans pickle beautifully in spiced vinegar — treat like gherkins.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
      {
        method: 'freeze',
        how: 'Blanch slices or halves for 1 minute, cool, and freeze flat on a tray before bagging.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [BBC_GOOD_FOOD.pickles],
  },
  {
    plantId: 'butternut-squash',
    summary: 'The best-keeping squash for Scottish kitchens if it ripens — cure hard and it stores for months.',
    methods: [
      {
        method: 'cure',
        how: 'Cure 10–14 days somewhere warm and airy until the skin dulls and hardens. Unripe green fruits still make good soup — use those first.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store at 10–15°C, dry, with airflow. A spare-room shelf beats a cold shed — butternut dislikes storage below 10°C.',
        storageLife: '3–6 months',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Roast and mash, or freeze raw cubes on a tray then bag — raw cubes hold together better than other squash.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('butternut_squash', 'Butternut squash')],
  },
  {
    plantId: 'spaghetti-squash',
    summary: 'Stores like other winter squash; the strands also freeze well once cooked.',
    methods: [
      {
        method: 'cure',
        how: 'Cure 10–14 days in sun or a greenhouse until the skin is hard and evenly yellow.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store cool, dry and frost-free with space around each fruit.',
        storageLife: '2–4 months',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Roast halves, fork out the strands, and freeze in meal-sized bags. Reheat from frozen in a pan.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('squash', 'Squash')],
  },
  {
    plantId: 'acorn-squash',
    summary: 'A shorter keeper than butternut — eat these first from the squash shelf.',
    methods: [
      {
        method: 'cure',
        how: 'Cure only briefly (5–7 days) — long curing shortens acorn squash storage rather than extending it.',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'store-cool',
        how: 'Store cool and dry and plan to eat within a couple of months, before the flesh goes stringy.',
        storageLife: '5–8 weeks',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Bake, scoop and mash before freezing in portions.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('squash', 'Squash')],
  },
]
