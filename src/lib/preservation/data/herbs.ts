/**
 * Herbs — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  BBC_GOOD_FOOD,
  bbcFoodDish,
  bbcFoodIngredient,
  bbcFoodRecipe,
  bbcGoodFoodCollection,
  greatBritishChefsRecipe,
} from '../resources'

export const herbsPreservation: PreservationGuide[] = [
  {
    plantId: 'parsley',
    summary:
      'Cut-and-come-again all season — freeze the surplus, because frozen parsley beats dried every time.',
    methods: [
      {
        method: 'fridge',
        how: 'Stand stems in a jar of water in the fridge like a bunch of flowers, loosely covered with a bag.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Chop and pack into ice-cube trays, top up with water, and freeze. Drop cubes straight into soups and sauces.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Dries quickly on a tray in a warm airy room, but expect it to lose most of its flavour — freezing is the better keep.',
        storageLife: '6–12 months in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('parsley', 'Parsley')],
  },
  {
    plantId: 'coriander',
    summary:
      'Bolts before you can blink — freeze the leaves fast and let a few plants run to seed for the spice jar.',
    methods: [
      {
        method: 'fridge',
        how: 'Wrap in damp kitchen paper inside a bag in the salad drawer. Use within days — it fades fast.',
        storageLife: '4–5 days',
      },
      {
        method: 'freeze',
        how: 'Blitz leaves with a little oil and freeze in ice-cube trays for curry bases. Keep oil cubes frozen — never store herb oils at room temperature.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Skip drying the leaves — dry the ripe seed heads instead. Hang in a paper bag until the seeds rattle free.',
        storageLife: 'seeds keep 1 year+ airtight',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('coriander', 'Coriander')],
  },
  {
    plantId: 'mint',
    summary:
      'Grows faster than you can drink tea — freeze cubes for sauce and dry bundles for the winter teapot.',
    methods: [
      {
        method: 'fridge',
        how: 'Stand sprigs in a glass of water on the worktop or in the fridge door.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Chop into ice-cube trays with water — ready-made portions for mint sauce and summer drinks.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Hang small bunches somewhere warm and airy, then crumble into a jar for tea. Cut just before flowering for the strongest flavour.',
        storageLife: '1 year in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('mint', 'Mint'),
      bbcGoodFoodCollection('mint-recipes', 'Mint recipes'),
      bbcFoodDish('mint_sauce', 'Mint sauce'),
    ],
  },
  {
    plantId: 'thyme',
    summary: 'A woody herb that dries brilliantly — one good summer harvest stocks the jar for a year.',
    methods: [
      {
        method: 'fridge',
        how: 'Sprigs keep well in a bag in the fridge — thyme is tougher than the soft herbs.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'dry',
        how: 'Hang bundles in an airy spot for a week or two, then strip the leaves from the stems straight into a jar.',
        storageLife: '1 year+ in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Freeze whole sprigs in a bag and crumble them frozen into the pot — no chopping needed.',
        storageLife: '6–12 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('thyme', 'Thyme')],
  },
  {
    plantId: 'rosemary',
    summary: 'Evergreen, so fresh sprigs are there most of the year — dry a batch anyway for when snow buries the bush.',
    methods: [
      {
        method: 'fridge',
        how: 'Cut sprigs keep a fortnight in a bag in the fridge, though picking fresh is usually easier.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'dry',
        how: 'Hang sprigs in an airy spot until the needles snap, then strip into a jar. Holds its punch better dried than most herbs.',
        storageLife: '1 year+ in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Open-freeze sprigs on a tray, then bag — the needles stay separate for winter roasts.',
        storageLife: '6–12 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('rosemary', 'Rosemary')],
  },
  {
    plantId: 'chives',
    summary: 'Snip, freeze, repeat — chives lose everything when dried, so the freezer is the only preserve worth doing.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep snipped chives in a tub in the fridge and use within the week.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Snip into short lengths and freeze loose in a tub — no blanching, no fuss. Chive butter frozen in a log is even better.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('chives', 'Chives')],
  },
  {
    plantId: 'lovage',
    summary: 'One plant makes more celery flavour than a family can use — freeze it chopped as instant stock seasoning.',
    methods: [
      {
        method: 'fridge',
        how: 'Cut stems keep in a bag in the salad drawer for a few days.',
        storageLife: '4–5 days',
      },
      {
        method: 'freeze',
        how: 'Chop leaves and young stems and freeze in small bags or cubes — one cube seasons a pot of soup or stock.',
        storageLife: '6–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Dry leaves on a tray and crumble into a jar — a homemade stock powder with real depth.',
        storageLife: '6–12 months in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('lovage', 'Lovage'),
      bbcFoodRecipe('lettuceandlovagesoup_14299', 'Lettuce and lovage soup'),
    ],
  },
  {
    plantId: 'sorrel',
    summary: 'Wilts within hours of picking — eat it fresh, and cook the glut down into a puree for the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves just before use — sorrel collapses fast and does not travel.',
        storageLife: 'use the same day; 2–3 days in the fridge at best',
      },
      {
        method: 'freeze',
        how: 'Wilt a big panful in butter until it turns khaki (it always does), then freeze the puree in small tubs for sauces and soup.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('sorrel', 'Sorrel'),
      greatBritishChefsRecipe('sorrel-soup-recipe', 'Sorrel soup (green borscht)'),
    ],
  },
  {
    plantId: 'oregano',
    summary: 'One of the few herbs that improves with drying — the flavour actually intensifies in the jar.',
    methods: [
      {
        method: 'fridge',
        how: 'Sprigs keep well in a bag in the fridge for a week or more.',
        storageLife: '1–2 weeks',
      },
      {
        method: 'dry',
        how: 'Cut whole stems just as flower buds show and hang in bundles. Strip and jar once crackly — dried oregano beats fresh in most cooking.',
        storageLife: '1 year+ in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Freeze chopped leaves in oil-filled ice-cube trays for pizza and pasta sauces. Keep the cubes frozen — herb oils are not safe stored at room temperature.',
        storageLife: '6 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('oregano', 'Oregano')],
  },
  {
    plantId: 'sage',
    summary: 'Evergreen and generous — dry a jarful for stuffing season and freeze a few leaves in butter.',
    methods: [
      {
        method: 'fridge',
        how: 'Leaves keep a fortnight wrapped in kitchen paper in a bag.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'dry',
        how: 'Dry leaves slowly on a rack out of direct sun — rush it and they go musty. Store whole and crumble as needed.',
        storageLife: '1 year in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Mash chopped sage into butter, roll into a log and freeze — slice off rounds for roast squash and Sunday birds.',
        storageLife: '3–6 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('sage', 'Sage')],
  },
  {
    plantId: 'french-tarragon',
    summary: 'Too good to waste and useless dried — freeze sprigs and make the classic tarragon vinegar.',
    methods: [
      {
        method: 'fridge',
        how: 'Wrap sprigs in damp kitchen paper in a bag; use within the week.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Freeze whole sprigs in a bag or chop into butter for a freezer log — drying kills the aniseed flavour entirely.',
        storageLife: '3–6 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'Steep a few sprigs in a bottle of white wine vinegar for 2–3 weeks, then strain — tarragon vinegar is the backbone of bearnaise. Keep in the fridge for the best flavour.',
        storageLife: '3–4 months refrigerated',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('tarragon', 'Tarragon')],
  },
  {
    plantId: 'dill',
    summary: 'Freeze the fronds for fish, dry the seed heads for the pickle pan — one plant, two harvests.',
    methods: [
      {
        method: 'fridge',
        how: 'Stand stems in water in the fridge; the fronds fade within days.',
        storageLife: '4–5 days',
      },
      {
        method: 'freeze',
        how: 'Chop fronds into ice-cube trays with water, or freeze whole sprigs flat in a bag for gravadlax and potato salads.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Hang ripe seed heads upside down in a paper bag until the seeds drop — dill seed is the essential pickling spice.',
        storageLife: 'seeds keep 1 year+ airtight',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('dill', 'Dill'), BBC_GOOD_FOOD.pickles],
  },
  {
    plantId: 'herb-fennel',
    summary: 'The feathery leaves freeze for fish; the seeds dry for sausages, bread and tea.',
    methods: [
      {
        method: 'fridge',
        how: 'Fronds keep a few days in a bag in the salad drawer — treat like dill.',
        storageLife: '4–5 days',
      },
      {
        method: 'freeze',
        how: 'Chop fronds into ice-cube trays with water and drop straight into fish dishes and sauces.',
        storageLife: '6 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Cut seed heads as they turn brown and dry in a paper bag until the seeds shake loose. Far more useful dried than the leaves.',
        storageLife: 'seeds keep 1 year+ airtight',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('fennel', 'Fennel')],
  },
  {
    plantId: 'lemon-balm',
    summary: 'A rampant grower best turned into tea — dry it gently and use the jar within months, before the lemon scent fades.',
    methods: [
      {
        method: 'fridge',
        how: 'Sprigs keep a few days in a bag, but the scent is strongest straight off the plant.',
        storageLife: '4–5 days',
      },
      {
        method: 'dry',
        how: 'Dry leaves fast in a warm airy room out of the sun, then jar whole. The lemon oils fade, so make small batches often.',
        storageLife: 'best within 6 months airtight',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Freeze chopped leaves in water-filled ice-cube trays — good dropped into summer drinks or a winter teapot.',
        storageLife: '6 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('lemon_balm', 'Lemon balm')],
  },
  {
    plantId: 'marjoram',
    summary: 'The sweeter cousin of oregano — dries just as well and holds its gentler flavour in the jar.',
    methods: [
      {
        method: 'fridge',
        how: 'Sprigs keep a week or more in a bag in the fridge.',
        storageLife: '1–2 weeks',
      },
      {
        method: 'dry',
        how: 'Hang bundles somewhere warm and airy just before the flowers open, then strip the dried leaves into a jar.',
        storageLife: '1 year in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Chop and freeze in water cubes for tomato sauces — handy since the plant rarely survives a Scottish winter outside.',
        storageLife: '6 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('marjoram', 'Marjoram')],
  },
  {
    plantId: 'bay',
    summary: 'The easiest preserve on the plot — pick leaves any day of the year, and dry a handful flat for the jar.',
    methods: [
      {
        method: 'fridge',
        how: 'Fresh-picked leaves keep a fortnight in a bag, though with an evergreen bush outside you rarely need to store them.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'dry',
        how: 'Dry whole leaves flat between sheets of kitchen paper under a light weight so they do not curl. Jar once brittle.',
        storageLife: '1 year+ in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('bay_leaf', 'Bay leaf')],
  },
  {
    plantId: 'borage',
    summary: 'Grown for the blue flowers — use them the day you pick them, or freeze them into ice cubes for summer drinks.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick flowers and young leaves just before use — they wilt within hours. Scatter flowers over salads and puddings.',
        storageLife: 'use the same day',
      },
      {
        method: 'freeze',
        how: 'Set a single flower in each ice-cube tray compartment, top with water and freeze — the classic garnish for a jug of Pimms.',
        storageLife: '6 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('borage', 'Borage')],
  },
  {
    plantId: 'chamomile',
    summary: 'A tea crop, pure and simple — pick the open flowers on a dry morning and dry them the same day.',
    methods: [
      {
        method: 'fresh',
        how: 'Fresh flowers make a delicate tea — steep a small handful in just-boiled water for 5 minutes.',
        storageLife: 'use the same day',
      },
      {
        method: 'dry',
        how: 'Spread flower heads in a single layer on a tray in a warm airy room for a week, then store airtight. About a teaspoon of dried flowers per cup.',
        storageLife: '1 year in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
  },
  {
    plantId: 'winter-savory',
    summary: 'The bean herb — evergreen through most winters, and its peppery leaves dry without losing their bite.',
    methods: [
      {
        method: 'fridge',
        how: 'Sprigs keep a fortnight in a bag, though the bush usually offers fresh pickings most of the year.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'dry',
        how: 'Hang bundles to dry and strip the leaves into a jar — made for winter pots of dried beans and lentils.',
        storageLife: '1 year in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Freeze whole sprigs in a bag and crumble frozen into stews.',
        storageLife: '6–12 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('savory', 'Savory')],
  },
  {
    plantId: 'hyssop',
    summary: 'Minty-bitter leaves that the bees love — dry a small jarful for teas and hearty stews.',
    methods: [
      {
        method: 'fridge',
        how: 'Sprigs keep well in a bag in the fridge — it is a tough little shrub.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'dry',
        how: 'Hang flowering stems in an airy spot, then strip leaves and flowers into a jar. Use sparingly — the flavour is strong.',
        storageLife: '1 year in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Freeze chopped leaves in water cubes for slow-cooked bean and game dishes.',
        storageLife: '6 months frozen',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('hyssop', 'Hyssop')],
  },
]
