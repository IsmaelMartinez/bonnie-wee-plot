/**
 * Alliums — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  RHS_ONIONS,
  GARDEN_ORGANIC_STORING,
  UMN_HARVEST_STORAGE,
  BBC_GOOD_FOOD,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
  bbcGoodFoodRecipe,
  greatBritishChefsRecipe,
} from '../resources'

export const alliumsPreservation: PreservationGuide[] = [
  {
    plantId: 'onion',
    summary:
      'Cure them hard and a good onion harvest carries the kitchen from autumn to spring — pickle the small ones.',
    methods: [
      {
        method: 'cure',
        how: 'Once the tops flop, lift and dry for 2–3 weeks in sun or a greenhouse until the necks are papery and the skins rustle. Skip the curing and they will not keep.',
        resources: [RHS_ONIONS],
      },
      {
        method: 'store-cool',
        how: 'Plait, net or tray them somewhere cool, dry and airy — a shed or spare room, never a steamy kitchen. Use any thick-necked ones first and check monthly for softies.',
        storageLife: '4–8 months depending on variety',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'The undersized ones are your pickling onions — peel, brine overnight, then pack in spiced malt vinegar. The safe classic for low-acid alliums.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling, BBC_GOOD_FOOD.pickles],
      },
      {
        method: 'jam',
        how: 'Onion marmalade — slow-cooked with sugar and vinegar — turns a glut of poor keepers into the best thing on a cheese board.',
        storageLife: '6–12 months in sealed jars',
        resources: [BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('onion', 'Onion'),
      bbcGoodFoodCollection('onion-recipes', 'Onion recipes'),
      bbcGoodFoodRecipe('french-onion-soup', 'French onion soup'),
    ],
  },
  {
    plantId: 'garlic',
    summary:
      'Well-cured garlic needs no preserving at all — hardnecks see you to midwinter, softnecks to late spring.',
    methods: [
      {
        method: 'cure',
        how: 'Lift when the lower leaves yellow and dry whole plants for 2–4 weeks somewhere airy under cover. Handle gently — bruised bulbs rot first.',
        resources: [RHS_ONIONS],
      },
      {
        method: 'store-cool',
        how: 'Plait softnecks or net the bulbs and hang cool, dry and dark. Not the fridge — cold, damp storage makes cloves sprout.',
        storageLife: '6–10 months (softnecks keep longest)',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Peel and freeze whole cloves, or blitz with a little water and freeze in ice-cube trays. Do not store garlic in oil at room temperature — it is a botulism risk; keep any garlic oil in the fridge and use it within days.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('garlic', 'Garlic'),
      bbcGoodFoodCollection('garlic-recipes', 'Garlic recipes'),
    ],
  },
  {
    plantId: 'leek',
    summary:
      'The plot is the store — leeks stand happily in the ground all winter, so lift only what the pot needs.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave them standing where they grew and lift as needed right through to spring — they shrug off Scottish frosts. Heel a few into a spare corner if the bed is needed.',
        storageLife: 'in the ground until March–April',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Once pulled, trim the roots and keep unwashed in a bag in the salad drawer.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Wash well (grit hides deep), slice into rings and freeze flat on a tray before bagging. Frozen leeks go soft, so save them for soup, stock and pies.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('leek', 'Leek'),
      greatBritishChefsRecipe('cock-a-leekie-soup-recipe', 'Cock-a-leekie soup'),
      bbcGoodFoodRecipe('leek-potato-soup', 'Leek & potato soup'),
    ],
  },
  {
    plantId: 'spring-onion',
    summary:
      'Sown little and often there should never be a glut — but chopped-and-frozen surplus is handy for cooking.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in a bag in the salad drawer, or stand the bunch roots-down in a jar of water where they stay perky for longer.',
        storageLife: 'about 10 days',
      },
      {
        method: 'freeze',
        how: 'Chop whites and greens, freeze loose on a tray and bag — no blanching needed. Scatter straight from frozen into stir-fries, eggs and soups.',
        storageLife: '3–6 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spring_onion', 'Spring onion')],
  },
  {
    plantId: 'shallot',
    summary:
      'Better keepers than onions and the classic pickling allium — cure well and they last to spring.',
    methods: [
      {
        method: 'cure',
        how: 'Lift when the tops die back, split the clusters and dry for 2–3 weeks until the skins are papery.',
        resources: [RHS_ONIONS],
      },
      {
        method: 'store-cool',
        how: 'Net or tray somewhere cool, dry and airy. Set aside the best bulbs for replanting next spring — one set becomes a cluster.',
        storageLife: '6–9 months',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'Pickled shallots beat pickled onions for sweetness — peel, brine overnight, then jar in spiced vinegar for Christmas.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling, BBC_GOOD_FOOD.pickles],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('shallot', 'Shallot'),
      BBC_GOOD_FOOD.pickles,
    ],
  },
  {
    plantId: 'welsh-onion',
    summary:
      'A perennial cut-and-come-again clump — the plant itself is the store, standing green nearly year-round.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut stems as needed and let the clump regrow — in most Scottish winters it stays pickable. Use within a few days of cutting.',
        storageLife: 'about 1 week cut; year-round on the plant',
      },
      {
        method: 'freeze',
        how: 'Chop any surplus like spring onions and freeze loose in bags — straight into cooked dishes from frozen.',
        storageLife: '3–6 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spring_onion', 'Spring onion')],
  },
  {
    plantId: 'elephant-garlic',
    summary:
      'Mild, roastable and huge — but a shorter keeper than true garlic, so eat these bulbs first.',
    methods: [
      {
        method: 'cure',
        how: 'Lift carefully (the bulbs sit deep), and dry whole for 3–4 weeks somewhere airy — the big cloves take longer to cure than true garlic.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Hang in nets somewhere cool, dry and dark. It does not keep as long as true garlic, so use elephant bulbs before your main crop.',
        storageLife: '3–5 months',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Roast whole cloves until soft, then freeze the sweet paste in ice-cube trays — instant garlic butter and mash all winter.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('garlic', 'Garlic')],
  },
  {
    plantId: 'walking-onion',
    summary:
      'Two harvests in one: fresh green tops through the season and topset bulbils that cure, store and pickle.',
    methods: [
      {
        method: 'fridge',
        how: 'Use the green stems fresh like spring onions — cut, bag and keep in the salad drawer.',
        storageLife: 'about 10 days',
      },
      {
        method: 'cure',
        how: 'Gather the topset bulbils when the stalks dry, and cure for a week or two until the skins are papery. Keep a handful back for replanting — or let them walk.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store cured bulbils in a paper bag or net somewhere cool and dry, and use them like tiny shallots.',
        storageLife: '3–6 months',
      },
      {
        method: 'pickle',
        how: 'The fiddly-but-worth-it classic: peel the bulbils and pickle in spiced vinegar like cocktail onions.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
  },
  {
    plantId: 'potato-onion',
    summary:
      'A heritage multiplier bred for the store cupboard — among the longest-keeping onions you can grow.',
    methods: [
      {
        method: 'cure',
        how: 'Lift the clusters when the tops die down, split, and dry for 2–3 weeks until the skins rustle.',
        resources: [RHS_ONIONS],
      },
      {
        method: 'store-cool',
        how: 'Net or tray somewhere cool, dry and airy — well-cured potato onions can still be sound when the new crop comes in. Save the mid-sized bulbs for replanting.',
        storageLife: '8–12 months',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'The smallest bulbs make grand pickling onions — brine, then jar in spiced vinegar.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('onion', 'Onion')],
  },
  {
    plantId: 'garlic-chives',
    summary:
      'Best snipped fresh from the clump — freeze the surplus, as drying loses the garlicky punch.',
    methods: [
      {
        method: 'fridge',
        how: 'Wrap cut leaves in damp kitchen paper in a bag in the salad drawer, and use the pretty white flowers fresh in salads.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Snip finely and freeze loose in a tub, or pack into ice-cube trays with a splash of water — no blanching needed. Add frozen at the end of cooking.',
        storageLife: '4–6 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('chives', 'Chives')],
  },
  {
    plantId: 'ramps',
    summary:
      'A fleeting spring treat — the leaves wilt in days, so turn the surplus into pesto for the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick leaves sparingly (take a leaf, not the plant) and use within a few days, wrapped damp in the fridge.',
        storageLife: '3–4 days',
      },
      {
        method: 'freeze',
        how: 'Blitz the leaves into pesto or butter and freeze in ice-cube trays, or blanch whole leaves for 30 seconds and freeze flat in bags.',
        storageLife: '6–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'Pickle the small bulbs or the flower buds in a light vinegar brine — but lift bulbs only from a well-established patch, as they are slow to regrow.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('wild_garlic', 'Wild garlic')],
  },
]
