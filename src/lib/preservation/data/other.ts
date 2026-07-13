/**
 * Specialty Vegetables — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  GARDEN_ORGANIC_STORING,
  UMN_HARVEST_STORAGE,
  BBC_GOOD_FOOD,
  bbcFoodDish,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
  bbcGoodFoodRecipe,
} from '../resources'

export const otherPreservation: PreservationGuide[] = [
  {
    plantId: 'sweetcorn',
    summary:
      'The clock starts the moment you pick — eat or freeze the same day, before the sugars turn to starch.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick when the silks are brown and a pierced kernel bleeds milky juice, then get it in the pot. Sweetcorn loses sweetness by the hour, so harvest just before you cook.',
        storageLife: '1–2 days at most, and it is downhill all the way',
      },
      {
        method: 'freeze',
        how: 'Blanch whole cobs for 4–6 minutes or strip the kernels and blanch for 2, cool fast in iced water, and bag. Freezing is the safe route for corn — never home-can it without pressure canning.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('sweetcorn', 'Sweetcorn'),
      bbcGoodFoodCollection('sweetcorn-recipes', 'Sweetcorn recipes'),
      bbcGoodFoodRecipe('sweetcorn-fritters', 'Sweetcorn fritters'),
    ],
  },
  {
    plantId: 'asparagus',
    summary:
      'A short season best eaten spear-to-pan the same day; blanch and freeze the surplus rather than trying to store it.',
    methods: [
      {
        method: 'fridge',
        how: 'Stand the spears upright in a jar with an inch of water, like a bunch of flowers, and keep in the fridge. Trim the bases first.',
        storageLife: '3–4 days',
      },
      {
        method: 'freeze',
        how: 'Blanch spears 2–4 minutes depending on thickness, cool in iced water, and freeze flat on a tray before bagging. Frozen spears go soft, so plan them for soups, tarts and risotto rather than steaming whole.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'Pack blanched spears upright in jars of hot spiced vinegar for a sharp spring pickle. Asparagus is a low-acid vegetable, so vinegar pickling or freezing only — never plain home canning.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('asparagus', 'Asparagus'),
      bbcGoodFoodCollection('asparagus-recipes', 'Asparagus recipes'),
    ],
  },
  {
    plantId: 'globe-artichoke',
    summary:
      'Best cooked within days of cutting; a glut of buds becomes frozen hearts or a jar of marinated hearts in the fridge.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed buds in a bag in the salad drawer and cook within the week. A splash of water in the bag stops the bracts drying out.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Trim down to the hearts, rub with lemon to stop browning, blanch for 5–7 minutes, then cool and freeze. Raw artichoke discolours and freezes badly.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'Simmer trimmed hearts in vinegar and water, then jar in fresh spiced vinegar. Hearts kept under oil are fridge-only and short-life — never a shelf preserve.',
        storageLife: 'pickled 6–12 months sealed; hearts in oil a few days in the fridge',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('globe_artichoke', 'Globe artichoke')],
  },
  {
    plantId: 'rhubarb',
    summary:
      'The great Scottish glut crop — it freezes raw with no fuss and turns into crumbles, jam and cordial all year.',
    methods: [
      {
        method: 'fridge',
        how: 'Wrap pulled stems in a damp cloth or bag in the salad drawer. Leaves off and on the compost — they are not edible.',
        storageLife: '1–2 weeks',
      },
      {
        method: 'freeze',
        how: 'Chop raw into crumble-sized chunks and open-freeze on a tray before bagging — no blanching needed. Freeze in weighed batches so each bag is one crumble or one batch of jam.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Rhubarb and ginger jam is the classic; rhubarb chutney handles the coarser late stems. Low in pectin, so pair with jam sugar or a high-pectin fruit.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('rhubarb', 'Rhubarb'),
      bbcGoodFoodCollection('rhubarb-recipes', 'Rhubarb recipes'),
      bbcFoodDish('rhubarb_crumble', 'Rhubarb crumble'),
    ],
  },
  {
    plantId: 'celery',
    summary:
      'Keeps a fortnight in the fridge; after that it is soup-bag territory — frozen celery is for cooking, not crunching.',
    methods: [
      {
        method: 'fridge',
        how: 'Wrap whole heads tightly in foil or a damp cloth in the salad drawer. Limp stalks revive in a jug of iced water.',
        storageLife: 'about 2 weeks',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Chop and blanch for 1–2 minutes, or freeze raw straight into a soup bag with other stock vegetables. Frozen celery loses its crunch, so it is for soups, stews and stock only.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Dry the leaves and thin stalks in a low oven or dehydrator, then crumble with salt for homemade celery salt. Store airtight in the dark.',
        storageLife: '6–12 months airtight',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('celery', 'Celery'),
      bbcGoodFoodCollection('celery-recipes', 'Celery recipes'),
    ],
  },
  {
    plantId: 'cardoon',
    summary:
      'Blanched stems are a use-it-fresh crop — cook within the week, and freeze any cooked surplus for gratins.',
    methods: [
      {
        method: 'fridge',
        how: 'Wrap the cut stems in a damp cloth in the salad drawer and use within a week. Always cook cardoon before eating — strip the strings and simmer until tender.',
        storageLife: 'up to 1 week',
      },
      {
        method: 'freeze',
        how: 'Cut into short lengths, rub with lemon, blanch in acidulated water for 5 minutes, then cool and freeze. Ready straight from the freezer for gratins and stews.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'mashua',
    summary:
      'Treat the tubers like oca — lift after frost and store cool and dark; a few days of light sweetens the peppery bite.',
    methods: [
      {
        method: 'store-cool',
        how: 'Lift after the first frosts, let the tubers dry for a day, and store in paper bags or trays somewhere cool, dark and frost-free. A few days in daylight before cooking mellows the mustardy heat.',
        storageLife: '2–3 months cool and dark',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Smaller batches keep in a paper bag in the salad drawer. Best roasted or boiled — raw mashua is fierce.',
        storageLife: '2–3 weeks',
      },
    ],
  },
]
