/**
 * Leafy Greens — Preserving guides
 * Authoring spec: src/lib/preservation/data/README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  UMN_SAUERKRAUT,
  UMN_HARVEST_STORAGE,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
} from '../resources'

export const leafyGreensPreservation: PreservationGuide[] = [
  {
    plantId: 'lettuce',
    summary:
      'Lettuce does not preserve — sow little and often instead, and let the plot be the store.',
    methods: [
      {
        method: 'fresh',
        how: 'Harvest outer leaves cut-and-come-again and the plant keeps producing for weeks — far better storage than any bag.',
      },
      {
        method: 'fridge',
        how: 'Pick cool in the morning, keep dry and unwashed in a sealed bag in the salad drawer. Whole heads keep better than loose leaves.',
        storageLife: 'about 5 days',
        resources: [UMN_HARVEST_STORAGE],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('lettuce', 'Lettuce'),
      bbcGoodFoodCollection('lettuce-recipes', 'Lettuce recipes'),
    ],
  },
  {
    plantId: 'spinach',
    summary: 'Wilts within days fresh, but blanches and freezes brilliantly — a glut is soup and saag waiting to happen.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves straight into the kitchen — spinach is at its best the day it is cut.',
      },
      {
        method: 'fridge',
        how: 'Keep dry, unwashed leaves in a sealed bag in the salad drawer and use quickly.',
        storageLife: '2–3 days',
      },
      {
        method: 'freeze',
        how: 'Blanch 1–2 minutes (or wilt in a dry pan), cool, squeeze out the water and freeze in fist-sized balls. A carrier bag of leaves shrinks to a few portions.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('spinach', 'Spinach'),
      bbcGoodFoodCollection('spinach-recipes', 'Spinach recipes'),
    ],
  },
  {
    plantId: 'perpetual-spinach',
    summary: 'The plant itself is the store — it stands all winter — so only freeze what a heavy cut leaves you.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep cut leaves dry in a sealed bag in the salad drawer.',
        storageLife: 'up to 1 week',
      },
      {
        method: 'freeze',
        how: 'Treat exactly like spinach: blanch 1–2 minutes, squeeze dry and freeze in portions. Chop any thick midribs first.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('chard', 'Chard')],
  },
  {
    plantId: 'kale',
    summary: 'The hardiest storage method is the plant itself — pick all winter, and freeze only a spring glut before it flowers.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave it standing and pick lower leaves as you need them — frost sweetens the flavour, and the plant crops from autumn to spring.',
      },
      {
        method: 'fridge',
        how: 'Keep picked leaves in a bag in the salad drawer.',
        storageLife: 'about 5 days',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Strip leaves from the tough midribs, blanch 1 minute, squeeze dry and bag in portions — ready for soups and stews.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('kale', 'Kale'),
      bbcGoodFoodCollection('kale-recipes', 'Kale recipes'),
    ],
  },
  {
    plantId: 'cavolo-nero',
    summary: 'Like kale, it stores best on the plant through winter — freeze the surplus for ribollita and pasta.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick from the bottom up as needed — it stands through the hardest Scottish winter and tastes better for the frost.',
      },
      {
        method: 'fridge',
        how: 'Keep picked leaves in a bag in the salad drawer.',
        storageLife: 'about 5 days',
      },
      {
        method: 'freeze',
        how: 'Strip out the midribs, blanch 1 minute, squeeze dry and freeze in portions.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('kale', 'Kale')],
  },
  {
    plantId: 'chard',
    summary: 'Two crops in one: freeze the leaves like spinach, and pickle or cook the stems separately.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut outer leaves regularly and the plant keeps producing into winter — pick as you need rather than storing.',
      },
      {
        method: 'fridge',
        how: 'Keep unwashed leaves in a bag in the salad drawer.',
        storageLife: '3–4 days',
      },
      {
        method: 'freeze',
        how: 'Separate leaves from stems. Blanch leaves 1–2 minutes and stems 2–3 minutes, squeeze or drain, and freeze in separate bags.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'The colourful stems pickle well — cut into batons, pack into spiced vinegar and keep in the fridge for salads and cheese boards.',
        storageLife: '2–3 months in the fridge',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('chard', 'Chard')],
  },
  {
    plantId: 'rocket',
    summary: 'A sow-every-3-weeks crop, not a storing one — whizz a glut into pesto for the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves as you need them — the flavour fades within days of cutting.',
      },
      {
        method: 'fridge',
        how: 'Keep dry in a sealed bag in the salad drawer and use before it yellows.',
        storageLife: '3–4 days',
      },
      {
        method: 'freeze',
        how: 'Raw leaves do not freeze, but rocket pesto does — blend with oil, nuts and cheese and freeze in ice-cube trays.',
        storageLife: '3–4 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('rocket', 'Rocket')],
  },
  {
    plantId: 'pak-choi',
    summary: 'Eat fresh within the week, or ferment a glut kimchi-style — pak choi is the classic kimchi green.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep whole heads dry in a bag in the salad drawer — baby leaves wilt faster than full heads.',
        storageLife: 'about 5 days',
      },
      {
        method: 'ferment',
        how: 'Salt quartered heads for a few hours, rinse, coat in a chilli-garlic-ginger paste and pack into a jar to ferment kimchi-style. Follow tested salt ratios.',
        storageLife: 'several months in the fridge once fermented',
        resources: [UMN_SAUERKRAUT, NCHFP.fermenting],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('pak_choi', 'Pak choi'),
      bbcGoodFoodCollection('kimchi-recipes', 'Kimchi recipes'),
    ],
  },
  {
    plantId: 'mizuna',
    summary: 'A standing winter salad — the plot keeps it fresher than the fridge ever will.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick cut-and-come-again through autumn and winter — mizuna shrugs off frost, so harvest little and often.',
      },
      {
        method: 'fridge',
        how: 'Keep dry leaves in a sealed bag in the salad drawer.',
        storageLife: 'about 5 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
  {
    plantId: 'land-cress',
    summary: 'A peppery watercress stand-in that stores itself in the plot all winter.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick outer leaves as needed — it crops right through a Scottish winter, so there is rarely a glut to deal with.',
      },
      {
        method: 'fridge',
        how: 'Keep cool and dry in a sealed bag; the peppery kick fades fast, so use within days.',
        storageLife: '3–4 days',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('watercress', 'Watercress')],
  },
  {
    plantId: 'corn-salad',
    summary: 'A winter picker, not a keeper — cut rosettes the day you eat them.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut whole rosettes at soil level as you need them — the plants stand happily under frost and even snow.',
      },
      {
        method: 'fridge',
        how: 'Wash carefully (it grows low and gritty), dry well and keep in a sealed bag.',
        storageLife: 'about 5 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
  {
    plantId: 'winter-purslane',
    summary: 'Succulent leaves that keep growing all winter — harvest to order rather than storing.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick stems and leaves through winter and it regrows — self-seeds too, so next year looks after itself.',
      },
      {
        method: 'fridge',
        how: 'The succulent leaves hold better than lettuce — keep dry in a sealed bag in the salad drawer.',
        storageLife: 'about 5 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
  {
    plantId: 'mustard-greens',
    summary: 'Eat young leaves fresh, freeze the big ones for cooking, and ferment a glut into mustard-green kimchi.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep dry leaves in a sealed bag in the salad drawer — the mustard heat builds as leaves age.',
        storageLife: 'up to 6 days',
      },
      {
        method: 'freeze',
        how: 'Blanch larger leaves 1–2 minutes, squeeze dry and freeze in portions for stir-fries and braises.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'ferment',
        how: 'Salt, rinse and pack whole leaves with chilli, garlic and ginger to ferment kimchi-style — mustard greens are a traditional kimchi crop. Follow tested salt ratios.',
        storageLife: 'several months in the fridge once fermented',
        resources: [UMN_SAUERKRAUT, NCHFP.fermenting],
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('kimchi-recipes', 'Kimchi recipes')],
  },
  {
    plantId: 'watercress',
    summary: 'The most perishable leaf on the plot — use within days, or turn a glut into soup for the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut-and-come-again through the season and eat the day you pick.',
      },
      {
        method: 'fridge',
        how: 'Stand stems in a jar of water like a bunch of flowers, or wrap in damp paper in a bag — either way, eat within days.',
        storageLife: '2–3 days',
      },
      {
        method: 'freeze',
        how: 'Leaves collapse frozen raw, but watercress soup freezes perfectly — make it, cool it, and freeze in tubs.',
        storageLife: '3–4 months frozen as soup',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('watercress', 'Watercress')],
  },
  {
    plantId: 'salad-burnet',
    summary: 'An evergreen perennial — pick the cucumber-flavoured leaves fresh in every month of the year.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young sprigs as you need them — the plant is evergreen in most Scottish winters, so it stores itself.',
      },
      {
        method: 'fridge',
        how: 'Keep sprigs in a sealed bag or stand stems in a glass of water; the delicate flavour fades quickly.',
        storageLife: '3–4 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
  {
    plantId: 'orache',
    summary: 'A spinach stand-in for the pot — pick young, cook fresh, and freeze a heavy cut blanched.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep dry leaves in a sealed bag in the salad drawer and use within days.',
        storageLife: 'about 5 days',
      },
      {
        method: 'freeze',
        how: 'Blanch 1–2 minutes, squeeze dry and freeze in portions — use anywhere spinach would go.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'new-zealand-spinach',
    summary: 'Pick the tips all summer and freeze the surplus — always cook or blanch it before eating.',
    methods: [
      {
        method: 'fridge',
        how: 'The fleshy leaves keep better than true spinach — dry, in a sealed bag in the salad drawer.',
        storageLife: 'up to 6 days',
      },
      {
        method: 'freeze',
        how: 'Blanch tips 1–2 minutes (which also deals with the oxalates), squeeze dry and freeze in portions.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'good-king-henry',
    summary: 'A perennial that feeds you for years — eat spring shoots like asparagus and freeze summer leaves like spinach.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep cut shoots and leaves in a sealed bag in the salad drawer and use within the week.',
        storageLife: 'up to 6 days',
      },
      {
        method: 'freeze',
        how: 'Blanch leaves 1–2 minutes, squeeze dry and freeze in portions. Spring shoots are best eaten fresh.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'radicchio',
    summary: 'A winter stalwart — heads stand in the frost and keep a good week in the fridge once cut.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave heads standing and cut as needed — frost deepens the colour and takes the edge off the bitterness.',
      },
      {
        method: 'fridge',
        how: 'Trim the base and keep whole heads in a bag in the salad drawer — the tight heads keep far better than loose leaves.',
        storageLife: 'about 1 week',
        resources: [UMN_HARVEST_STORAGE],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('radicchio', 'Radicchio'),
      bbcGoodFoodCollection('chicory-recipes', 'Chicory recipes'),
    ],
  },
  {
    plantId: 'endive',
    summary: 'Stands well into winter on the plot; blanch the hearts before cutting to tame the bitterness.',
    methods: [
      {
        method: 'fresh',
        how: 'Tie up the outer leaves (or cap with a plate) 2 weeks before harvest to blanch the heart, and cut heads as you need them.',
      },
      {
        method: 'fridge',
        how: 'Keep whole heads in a bag in the salad drawer; loose leaves brown quickly at the cut edges.',
        storageLife: 'up to 6 days',
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('endive', 'Endive'),
      bbcGoodFoodCollection('chicory-recipes', 'Chicory recipes'),
    ],
  },
  {
    plantId: 'ice-plant',
    summary: 'A crunchy, salty curiosity best picked and eaten the same day.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick tender shoot tips as you need them — the plant keeps producing all summer.',
      },
      {
        method: 'fridge',
        how: 'The succulent leaves hold their crunch a few days in a sealed bag in the salad drawer.',
        storageLife: '3–4 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
]
