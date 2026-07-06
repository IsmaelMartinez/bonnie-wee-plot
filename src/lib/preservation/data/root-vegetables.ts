/**
 * Root Vegetables — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  GARDEN_ORGANIC_STORING,
  UMN_HARVEST_STORAGE,
  UMN_SAUERKRAUT,
  BBC_GOOD_FOOD,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
} from '../resources'

/** Shared fallback collections for roots without a BBC Food hub of their own */
const ROOT_VEG_RECIPES = bbcGoodFoodCollection('root-vegetable-recipes', 'Root vegetable recipes')
const RADISH_RECIPES = bbcGoodFoodCollection('radish-recipes', 'Radish recipes')

export const rootVegetablesPreservation: PreservationGuide[] = [
  {
    plantId: 'carrot',
    summary:
      'A box of damp sand in a cool shed keeps maincrop carrots crisp until spring — the classic keeper.',
    methods: [
      {
        method: 'fridge',
        how: 'Twist off the tops (they pull moisture from the root) and keep unwashed in a bag in the salad drawer.',
        storageLife: '2–4 weeks',
      },
      {
        method: 'store-cool',
        how: 'Lift on a dry day, rub off loose soil and layer undamaged roots in boxes of damp sand somewhere cool and frost-free. Use any damaged ones first.',
        storageLife: '4–5 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Cut into batons or slices, blanch for 2–3 minutes, cool and bag. Small whole carrots freeze well blanched for 5 minutes.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('carrot', 'Carrot'),
      bbcGoodFoodCollection('carrot-cake-recipes', 'Carrot cake recipes'),
    ],
  },
  {
    plantId: 'beetroot',
    summary:
      'Stores for months in damp sand, and the glut makes the best pickle on the allotment.',
    methods: [
      {
        method: 'fridge',
        how: 'Twist the tops off an inch above the root — cutting makes them bleed — and keep unwashed in the fridge.',
        storageLife: '2–3 weeks',
      },
      {
        method: 'store-cool',
        how: 'Layer undamaged roots in boxes of damp sand in a cool, frost-free shed. Check monthly and use any that soften.',
        storageLife: '3–5 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'Boil until tender, slip the skins, slice and pack in spiced vinegar. Keep the jars in the fridge, or water-bath process them (see NCHFP) if you want them shelf-stable.',
        storageLife: '3–4 months in the fridge; 1 year+ if water-bath processed',
        resources: [NCHFP.pickling, BBC_GOOD_FOOD.pickles],
      },
      {
        method: 'freeze',
        how: 'Cook fully first — boil or roast, skin, cube and freeze in tubs. Raw beetroot goes rubbery in the freezer.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('beetroot', 'Beetroot'),
      bbcGoodFoodCollection('beetroot-recipes', 'Beetroot recipes'),
      BBC_GOOD_FOOD.chutneys,
    ],
  },
  {
    plantId: 'parsnip',
    summary:
      'The easiest keeper of all — leave them in the ground and let the frost do the sweetening.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave in the bed and dig as needed right through winter — frost converts starch to sugar and improves them. Mark the row before the tops die back.',
        storageLife: 'in the ground until early spring',
      },
      {
        method: 'store-cool',
        how: 'If the plot is far away or the ground freezes solid, lift and pack in boxes of damp sand in a cool shed.',
        storageLife: '3–4 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Cut into chunks, blanch for 2–3 minutes and freeze, or par-roast and freeze ready for the roasting tin.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('parsnip', 'Parsnip'),
      bbcGoodFoodCollection('parsnip-recipes', 'Parsnip recipes'),
    ],
  },
  {
    plantId: 'turnip',
    summary:
      'Eat the small summer ones fresh; maincrop turnips store in sand like any other root.',
    methods: [
      {
        method: 'fridge',
        how: 'Twist off the tops (cook those like spring greens) and keep the roots in a bag in the salad drawer.',
        storageLife: '2–3 weeks',
      },
      {
        method: 'store-cool',
        how: 'Lift maincrop turnips before hard frost, twist the tops off and store in boxes of damp sand somewhere cool.',
        storageLife: '3–4 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Cube, blanch for 2 minutes and freeze — best kept for mash, soups and stews rather than serving whole.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('turnip', 'Turnip'),
      bbcGoodFoodCollection('turnip-recipes', 'Turnip recipes'),
    ],
  },
  {
    plantId: 'swede',
    summary:
      'Hardy enough to sit in the ground until Burns Night — the lowest-effort winter storage there is.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave in the bed and lift as needed through winter — swedes shrug off Scottish frost better than almost anything.',
        storageLife: 'in the ground until spring',
      },
      {
        method: 'store-cool',
        how: 'Or lift, twist off the tops and store in boxes of damp sand or net sacks somewhere cool and frost-free.',
        storageLife: '4–6 months',
        resources: [GARDEN_ORGANIC_STORING, UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Cook and mash your neeps, then freeze in portions — ready to reheat alongside the haggis.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('swede', 'Swede'),
      bbcGoodFoodCollection('swede-recipes', 'Swede recipes'),
    ],
  },
  {
    plantId: 'radish',
    summary:
      'A sow-little-and-often crop — eat fresh within days, and quick-pickle any that get away.',
    methods: [
      {
        method: 'fresh',
        how: 'Best pulled and eaten the same day while they still snap. Woody or pithy ones have been left too long.',
        storageLife: 'a day or two at their best',
      },
      {
        method: 'fridge',
        how: 'Remove the leaves and keep the roots in a bag or a tub of water in the fridge to hold the crunch.',
        storageLife: 'up to 10 days',
      },
      {
        method: 'pickle',
        how: 'Slice into rounds and pour over a hot sweet-and-sour vinegar — quick-pickled radish is ready next day and lifts any salad or sandwich.',
        storageLife: '2–4 weeks in the fridge',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('radish', 'Radish'),
      RADISH_RECIPES,
      BBC_GOOD_FOOD.pickles,
    ],
  },
  {
    plantId: 'jerusalem-artichoke',
    summary:
      'Store them in the ground — the knobbly tubers shrivel fast once lifted, so dig only what you need.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave the tubers in the bed all winter and fork out a portion at a time. They are completely frost-hardy in the soil.',
        storageLife: 'in the ground until spring regrowth',
      },
      {
        method: 'store-cool',
        how: 'If you must lift a batch, pack unwashed tubers in damp sand and use within a few weeks — they lose moisture much faster than carrots.',
        storageLife: '2–4 weeks in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Cook into soup or a purée first and freeze in tubs. Raw tubers discolour and turn soft in the freezer.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('jerusalem_artichoke', 'Jerusalem artichoke'),
      bbcGoodFoodCollection('jerusalem-artichoke-recipes', 'Jerusalem artichoke recipes'),
    ],
  },
  {
    plantId: 'celeriac',
    summary:
      'An ugly root that keeps beautifully — sand-boxed celeriac gives celery flavour all winter.',
    methods: [
      {
        method: 'fridge',
        how: 'Trim the leaf stalks and whiskery roots, then keep whole and unwashed in the salad drawer.',
        storageLife: '3–4 weeks',
      },
      {
        method: 'store-cool',
        how: 'Lift before hard frost, trim the tops to a stub and pack in boxes of damp sand in a cool shed.',
        storageLife: '3–5 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Peel, cube and blanch for 2–3 minutes before bagging, or freeze it as ready-made mash or soup.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('celeriac', 'Celeriac'),
      bbcGoodFoodCollection('celeriac-recipes', 'Celeriac recipes'),
    ],
  },
  {
    plantId: 'salsify',
    summary:
      'Hardy enough to overwinter in the bed — lift the oyster-flavoured roots as the kitchen needs them.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave in the ground over winter and dig as needed — the long brittle roots keep best undisturbed in the soil.',
        storageLife: 'in the ground until spring',
      },
      {
        method: 'store-cool',
        how: 'Lifted roots dry out quickly, so pack them straight into damp sand and use within a few weeks.',
        storageLife: '2–4 weeks in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Peel (in a bowl of acidulated water to stop browning), blanch 2 minutes and freeze, or freeze as cooked purée for soup.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('salsify', 'Salsify'), ROOT_VEG_RECIPES],
  },
  {
    plantId: 'hamburg-parsley',
    summary:
      'Two crops in one — the parsnip-like roots store in ground or sand, and the tops freeze like parsley.',
    methods: [
      {
        method: 'fresh',
        how: 'Fully hardy, so leave the roots in the bed and lift through winter as needed.',
        storageLife: 'in the ground until early spring',
      },
      {
        method: 'store-cool',
        how: 'Or lift and pack in boxes of damp sand in a cool shed, the same as carrots and parsnips.',
        storageLife: '3–4 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Chop the leaves and freeze in ice-cube trays with a little water, just like parsley. The roots freeze best cubed and blanched for soup and stock.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [ROOT_VEG_RECIPES],
  },
  {
    plantId: 'florence-fennel',
    summary:
      'A poor keeper — eat the bulbs fresh and fast, and pickle or freeze any surplus for cooking.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut and eat as soon as the bulbs are fist-sized — they bolt and toughen quickly, so do not wait for bigger.',
        storageLife: 'a few days at its best',
      },
      {
        method: 'fridge',
        how: 'Keep whole bulbs in the salad drawer with the fronds trimmed off (freeze the fronds as a herb).',
        storageLife: 'about 10 days',
      },
      {
        method: 'freeze',
        how: 'Slice into wedges, blanch for 2–3 minutes and freeze — good braised or roasted later, though the raw crunch is lost.',
        storageLife: '6–10 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'Shave thinly and quick-pickle in sweet white-wine vinegar — keeps the aniseed freshness for salads and fish.',
        storageLife: '2–4 weeks in the fridge',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('fennel', 'Fennel'),
      bbcGoodFoodCollection('fennel-recipes', 'Fennel recipes'),
    ],
  },
  {
    plantId: 'mooli',
    summary:
      'Keeps a fortnight in the fridge, but the real destination for a glut is kimchi-style ferments and quick pickles.',
    methods: [
      {
        method: 'fridge',
        how: 'Remove the leaves and keep the roots wrapped or bagged in the salad drawer.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'pickle',
        how: 'Cube or slice and pour over a hot rice-vinegar brine with a little sugar and turmeric for danmuji-style pickles.',
        storageLife: '1–2 months in the fridge',
        resources: [NCHFP.pickling],
      },
      {
        method: 'ferment',
        how: 'Cube, salt at about 2 percent with garlic, ginger and chilli, and ferment at room temperature for a few days for kkakdugi (radish kimchi). Keep the tubers submerged in the brine.',
        storageLife: 'several months in the fridge once fermented',
        resources: [UMN_SAUERKRAUT, NCHFP.fermenting],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('daikon', 'Daikon (mooli)'), RADISH_RECIPES],
  },
  {
    plantId: 'black-radish',
    summary:
      'The winter radish that actually keeps — treat it like a storage root, not a salad crop.',
    methods: [
      {
        method: 'fridge',
        how: 'Top the roots and keep them in a bag in the salad drawer — far longer-lived than summer radish.',
        storageLife: '3 weeks or more',
      },
      {
        method: 'store-cool',
        how: 'Lift before hard frost and pack in boxes of damp sand in a cool shed, the same as carrots.',
        storageLife: '2–3 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'Slice or grate and quick-pickle in cider vinegar to tame the heat — good with cold meats and cheese.',
        storageLife: '1–2 months in the fridge',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('radish', 'Radish'), RADISH_RECIPES],
  },
  {
    plantId: 'scorzonera',
    summary:
      'Black salsify overwinters happily in the bed — dig as needed and handle the brittle roots gently.',
    methods: [
      {
        method: 'fresh',
        how: 'Fully hardy — leave in the ground all winter and lift a few roots at a time. Being perennial, any you miss simply grow on.',
        storageLife: 'in the ground until spring',
      },
      {
        method: 'store-cool',
        how: 'Lifted roots shrivel fast, so pack them straight into damp sand and use within a few weeks.',
        storageLife: '2–4 weeks in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Scrub, blanch 2–3 minutes, then slip the black skins and freeze the pale roots in bags for later braising.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('salsify', 'Salsify'), ROOT_VEG_RECIPES],
  },
  {
    plantId: 'horseradish',
    summary:
      'Dig roots as needed and preserve the grated heat in vinegar — a little goes a very long way.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave the patch in the ground and dig sections of root through autumn and winter — it is effectively unkillable.',
        storageLife: 'in the ground year-round',
      },
      {
        method: 'store-cool',
        how: 'Lifted roots keep for months packed in damp sand in a cool shed, ready for grating.',
        storageLife: '3–6 months in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'Grate (outdoors, or by an open window — it is stronger than onions) and pack into small jars topped with white vinegar and a pinch of salt.',
        storageLife: '3–6 months in the fridge',
        resources: [NCHFP.pickling],
      },
      {
        method: 'ferment',
        how: 'Grated root fermented in a 2 percent salt brine for a week or two makes a mellower, livelier condiment than the vinegar version.',
        storageLife: 'several months in the fridge',
        resources: [NCHFP.fermenting],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('horseradish', 'Horseradish')],
  },
  {
    plantId: 'chinese-artichoke',
    summary:
      'Crosnes barely store at all — keep them in the soil and lift small batches, pickling any surplus.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave the little spiral tubers in the ground and fork out a meal at a time through winter — they stay plump in the soil and shrivel within days out of it.',
        storageLife: 'in the ground until spring',
      },
      {
        method: 'fridge',
        how: 'Rinse and keep a lifted batch in a sealed bag or a tub of barely damp sand in the fridge, and use quickly.',
        storageLife: 'up to a week',
      },
      {
        method: 'pickle',
        how: 'The classic use for a surplus — brine briefly, then pack whole in spiced vinegar, as done in both France and Japan. No peeling needed, just a good scrub.',
        storageLife: '2–3 months in the fridge',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [ROOT_VEG_RECIPES],
  },
  {
    plantId: 'yacon',
    summary:
      'Cure the big storage tubers in the sun to sweeten, then they keep for months somewhere cool and dark.',
    methods: [
      {
        method: 'cure',
        how: 'Lift after the tops are frosted, separate the big storage tubers from the growing crowns, and cure in sun or a bright windowsill for 1–2 weeks — the sweetness builds noticeably.',
      },
      {
        method: 'store-cool',
        how: 'Store the cured tubers unwashed in a box somewhere cool, dark and frost-free. They sweeten further in storage; check monthly for soft ones.',
        storageLife: '3–5 months',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Once cut, wrap and keep in the fridge. Peeled slices are good in fruit salads and slaws — a squeeze of lemon stops browning.',
        storageLife: '1–2 weeks once cut',
      },
    ],
    recipeIdeas: [ROOT_VEG_RECIPES],
  },
  {
    plantId: 'skirret',
    summary:
      'The medieval sweet root — fully hardy, so the bed itself is the store cupboard.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave the root clusters in the ground all winter and lift as needed — flavour is best after frost. Replant a few offsets as you go for next year.',
        storageLife: 'in the ground until spring',
      },
      {
        method: 'store-cool',
        how: 'Lifted clusters keep a few weeks packed in damp sand in a cool shed, the same as other thin roots.',
        storageLife: '3–4 weeks in sand',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Scrub, blanch the thin roots for 2 minutes and freeze in bags — they roast well from frozen.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [ROOT_VEG_RECIPES],
  },
  {
    plantId: 'oca',
    summary:
      'Sun-cure the tubers after lifting to mellow the lemony tang, then store like small potatoes.',
    methods: [
      {
        method: 'cure',
        how: 'Lift after the first frost kills the tops, then lay the tubers on a sunny windowsill for one to two weeks — light greening mellows the oxalate sharpness and sweetens them.',
      },
      {
        method: 'store-cool',
        how: 'After curing, store in paper bags or trays somewhere cool, dark and frost-free. Save a handful of sound tubers for replanting in spring.',
        storageLife: '2–4 months',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Cook first — boil or roast, then freeze in portions. Raw tubers do not freeze well.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [ROOT_VEG_RECIPES],
  },
  {
    plantId: 'ulluco',
    summary:
      'The prettiest tuber on the plot but a short keeper — handle gently and eat within a few weeks.',
    methods: [
      {
        method: 'store-cool',
        how: 'Lift late (the tubers bulk up in autumn), handle the thin-skinned tubers gently and store unwashed in trays somewhere cool, dark and frost-free. Keep a few back for replanting.',
        storageLife: '4–8 weeks',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'A small batch keeps in a paper bag in the salad drawer — the waxy flesh stays firm boiled, steamed or sliced raw into salads.',
        storageLife: '2–3 weeks',
      },
      {
        method: 'freeze',
        how: 'Cook into stews or soup and freeze the finished dish — the tubers themselves do not freeze well raw.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [ROOT_VEG_RECIPES],
  },
]
